// AI Insights Service for Crop Watering Analysis
// src/services/aiInsightsService.ts

export interface ChartData {
  date: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  evapotranspiration: number;
  soilMoisture?: number;
  irrigationAmount?: number;
  cropStage: string;
  weatherConditions: string;
}

export interface CropInsight {
  id: string;
  chartType: string;
  title: string;
  insight: string;
  recommendation: string;
  confidence: number; // 0-100%
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'watering' | 'efficiency' | 'timing' | 'weather' | 'crop_health';
  actionItems: string[];
  estimatedSavings?: string;
  riskFactors?: string[];
}

export interface InsightContext {
  cropType: string;
  location: string;
  plantingDate: string;
  currentStage: string;
  fieldSize?: number;
  irrigationType?: string;
  soilType?: string;
  weatherHistory: ChartData[];
  irrigationHistory: ChartData[];
}

// Abstract base class for AI providers
abstract class AIProvider {
  abstract generateInsights(context: InsightContext): Promise<CropInsight[]>;
  abstract isConfigured(): boolean;
  abstract getName(): string;
}

// OpenAI GPT Integration
class OpenAIProvider extends AIProvider {
  private apiKey: string;
  private model: string = 'gpt-4-turbo-preview';

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || import.meta.env?.VITE_OPENAI_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getName(): string {
    return 'OpenAI GPT-4';
  }

  async generateInsights(context: InsightContext): Promise<CropInsight[]> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildPrompt(context);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a friendly, experienced farm advisor who talks like a supportive teammate. Use a warm, conversational tone with phrases like "Hey!", "Here\'s what I\'d do", "Just a heads up", etc. Be encouraging and approachable while providing expert agricultural advice. Sound like you\'re talking to a friend, not writing a technical manual.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseOpenAIResponse(data.choices[0].message.content, context);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }

  private buildPrompt(context: InsightContext): string {
    const recentData = context.weatherHistory.slice(-7); // Last 7 days
    const avgTemp = recentData.reduce((sum, d) => sum + d.temperature, 0) / recentData.length;
    const totalPrecip = recentData.reduce((sum, d) => sum + d.precipitation, 0);
    const avgHumidity = recentData.reduce((sum, d) => sum + d.humidity, 0) / recentData.length;
    const totalET = recentData.reduce((sum, d) => sum + d.evapotranspiration, 0);

    return `
Analyze this crop irrigation data and provide 3-5 specific, actionable insights:

CROP INFORMATION:
- Type: ${context.cropType}
- Location: ${context.location}
- Planting Date: ${context.plantingDate}
- Current Stage: ${context.currentStage}
- Field Size: ${context.fieldSize || 'Not specified'} acres
- Irrigation Type: ${context.irrigationType || 'Not specified'}
- Soil Type: ${context.soilType || 'Not specified'}

RECENT WEATHER DATA (Last 7 Days):
- Average Temperature: ${avgTemp.toFixed(1)}°F
- Total Precipitation: ${totalPrecip.toFixed(2)} inches
- Average Humidity: ${avgHumidity.toFixed(1)}%
- Total Evapotranspiration: ${totalET.toFixed(2)} inches

DETAILED DAILY DATA:
${recentData.map(d => 
  `${d.date}: ${d.temperature}°F, ${d.humidity}% humidity, ${d.precipitation}" rain, ${d.evapotranspiration}" ET, ${d.weatherConditions}`
).join('\n')}

For each insight, provide (in a friendly, conversational tone):
1. A catchy, friendly title (use emojis and engaging language!)
2. Insight written like friendly agricultural advice ("Hey there!", "Here's what's happening...", "This shows...")
3. Warm, practical recommendations ("Farmers should consider...", "This crop would benefit from...", "Best practice suggests...")
4. Confidence level (0-100%)
5. Severity (low/medium/high/critical)
6. Category (watering/efficiency/timing/weather/crop_health)  
7. 3-4 action items written as clear guidance ("Consider implementing...", "Monitor for...")
8. Estimated savings in agricultural terms ("This could reduce costs by...", "Potential savings...")
9. Risk factors explained practically ("Watch for signs of...", "Risk factors include...")

Write everything like friendly agricultural advice! Use:
- Engaging phrases: "Here's what's happening", "Good news", "Worth noting"
- Practical encouragement: "This approach works well", "Farmers often find success with"
- Clear explanations: "Think of it like...", "This means...", "In agricultural terms..."
- Professional guidance: "Best practice suggests...", "Consider this approach...", "Research shows..."

Focus on:
- Irrigation timing optimization (but explain it simply!)
- Water efficiency improvements (with encouraging savings estimates)
- Crop stress indicators (without scaring them)
- Weather-based adjustments (like helpful weather tips)
- Cost savings opportunities (celebrate the wins!)
- Yield protection strategies (supportive guidance)

Format as JSON array with this structure:
[{
  "title": "string",
  "insight": "string", 
  "recommendation": "string",
  "confidence": number,
  "severity": "low|medium|high|critical",
  "category": "watering|efficiency|timing|weather|crop_health",
  "actionItems": ["string1", "string2", "string3"],
  "estimatedSavings": "string or null",
  "riskFactors": ["string1", "string2"] or null
}]
`;
  }

  private parseOpenAIResponse(content: string, context: InsightContext): CropInsight[] {
    try {
      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      
      const insights = JSON.parse(jsonContent);
      
      return insights.map((insight: any, index: number) => ({
        id: `openai-${Date.now()}-${index}`,
        chartType: 'weather-irrigation',
        title: insight.title || 'AI Insight',
        insight: insight.insight || '',
        recommendation: insight.recommendation || '',
        confidence: Math.min(100, Math.max(0, insight.confidence || 75)),
        severity: insight.severity || 'medium',
        category: insight.category || 'watering',
        actionItems: insight.actionItems || [],
        estimatedSavings: insight.estimatedSavings,
        riskFactors: insight.riskFactors
      }));
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return this.getFallbackInsights(context);
    }
  }

  private getFallbackInsights(context: InsightContext): CropInsight[] {
    return [{
      id: `fallback-${Date.now()}`,
      chartType: 'weather-irrigation',
      title: 'AI Analysis Temporarily Unavailable',
      insight: 'Unable to generate detailed AI insights at this time.',
      recommendation: 'Continue monitoring weather conditions and adjust irrigation based on crop stage and soil moisture.',
      confidence: 50,
      severity: 'low',
      category: 'watering',
      actionItems: [
        'Check soil moisture manually',
        'Monitor weather forecasts',
        'Follow standard irrigation schedule'
      ]
    }];
  }
}

// Anthropic Claude Integration
class AnthropicProvider extends AIProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || import.meta.env?.VITE_ANTHROPIC_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getName(): string {
    return 'Anthropic Claude';
  }

  async generateInsights(context: InsightContext): Promise<CropInsight[]> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured');
    }

    const prompt = this.buildAnthropicPrompt(context);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAnthropicResponse(data.content[0].text, context);
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw error;
    }
  }

  private buildAnthropicPrompt(context: InsightContext): string {
    // Similar to OpenAI prompt but optimized for Claude
    return this.buildPromptBase(context);
  }

  private parseAnthropicResponse(content: string, context: InsightContext): CropInsight[] {
    // Similar parsing logic as OpenAI
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonContent = jsonMatch ? jsonMatch[0] : content;
      const insights = JSON.parse(jsonContent);
      
      return insights.map((insight: any, index: number) => ({
        id: `claude-${Date.now()}-${index}`,
        chartType: 'weather-irrigation',
        title: insight.title || 'AI Insight',
        insight: insight.insight || '',
        recommendation: insight.recommendation || '',
        confidence: Math.min(100, Math.max(0, insight.confidence || 80)),
        severity: insight.severity || 'medium',
        category: insight.category || 'watering',
        actionItems: insight.actionItems || [],
        estimatedSavings: insight.estimatedSavings,
        riskFactors: insight.riskFactors
      }));
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return this.getFallbackInsights(context);
    }
  }

  private buildPromptBase(context: InsightContext): string {
    // Base prompt logic shared between providers
    const recentData = context.weatherHistory.slice(-7);
    const avgTemp = recentData.reduce((sum, d) => sum + d.temperature, 0) / recentData.length;
    const totalPrecip = recentData.reduce((sum, d) => sum + d.precipitation, 0);

    return `As an agricultural AI expert, analyze this irrigation data for ${context.cropType} at ${context.location} and provide actionable insights in JSON format...`;
  }

  private getFallbackInsights(context: InsightContext): CropInsight[] {
    return [{
      id: `fallback-claude-${Date.now()}`,
      chartType: 'weather-irrigation',
      title: 'AI Analysis Temporarily Unavailable',
      insight: 'Claude analysis is currently unavailable.',
      recommendation: 'Continue with standard irrigation practices.',
      confidence: 50,
      severity: 'low',
      category: 'watering',
      actionItems: ['Monitor manually', 'Follow standard schedule']
    }];
  }
}

// Local/Rule-Based Insights (No API required)
class LocalInsightsProvider extends AIProvider {
  isConfigured(): boolean {
    return true; // Always available
  }

  getName(): string {
    return 'Local Analysis';
  }

  async generateInsights(context: InsightContext): Promise<CropInsight[]> {
    const insights: CropInsight[] = [];
    const recentData = context.weatherHistory.slice(-7);
    
    // Temperature analysis
    const avgTemp = recentData.reduce((sum, d) => sum + d.temperature, 0) / recentData.length;
    const maxTemp = Math.max(...recentData.map(d => d.temperature));
    const minTemp = Math.min(...recentData.map(d => d.temperature));
    
    if (maxTemp > 85) {
      const severity = maxTemp > 95 ? 'critical' : 'high';
      const urgency = maxTemp > 95 ? "This is pretty urgent!" : "Just a heads up!";
      
      insights.push({
        id: `local-temp-${Date.now()}`,
        chartType: 'temperature',
        title: maxTemp > 95 ? '🔥 Whoa! These plants are dealing with serious heat!' : '☀️ Hot weather alert for crop management',
        insight: `Hey there! ${urgency} It hit ${maxTemp}°F today, and ${context.cropType} crops are likely experiencing heat stress right now. When temperatures get this high, plants work overtime just to stay cool and can struggle to take up water efficiently.`,
        recommendation: `Here's what farmers should consider: early morning watering (around 5-7 AM) or evening irrigation (6-8 PM) works best during heat waves. This timing reduces water loss to evaporation and helps plants recover more effectively. Think of it like timing a cold drink perfectly when someone's really thirsty! 💧`,
        confidence: 90,
        severity: severity,
        category: 'crop_health',
        actionItems: [
          'Schedule irrigation for early morning (5-7 AM) when possible',
          'Increase soil moisture monitoring during heat periods', 
          'Consider shade cloth installation if available',
          'Evening watering (6-8 PM) helps plants recover overnight'
        ],
        estimatedSavings: undefined,
        riskFactors: ['Heat stress can reduce crop yields if not managed', 'Increased water demand during peak temperatures', 'Fruit quality may decline without proper heat management']
      });
    }

    // Precipitation analysis
    const totalRain = recentData.reduce((sum, d) => sum + d.precipitation, 0);
    if (totalRain > 2) {
      const rainAmount = totalRain.toFixed(1);
      
      insights.push({
        id: `local-rain-${Date.now()}`,
        chartType: 'precipitation',
        title: '🌧️ Great news! Natural irrigation just saved the day',
        insight: `Hey, check this out! The field received ${rainAmount} inches of natural precipitation this week - that's Mother Nature doing the heavy lifting! The crops are likely well-hydrated right now and may not need additional irrigation for a few days.`,
        recommendation: `Here's the smart play: farmers should take advantage of this free water by adjusting irrigation schedules. Skipping the next couple of watering sessions makes sense while letting crops enjoy this natural moisture. It's like getting a bonus - might as well use it! Monitoring soil moisture over the next few days helps ensure optimal levels. 🎯`,
        confidence: 85,
        severity: 'medium',
        category: 'efficiency',
        actionItems: [
          'Adjust irrigation schedule to skip next watering cycle',
          'Inspect field drainage systems for any standing water',
          'Monitor crops for potential fungal disease development',
          'Check soil moisture levels manually in 2-3 days'
        ],
        estimatedSavings: 'Farmers could save 15-25% on irrigation costs this week',
        riskFactors: ['Root rot risk if field drainage is inadequate', 'Fungal diseases thrive in prolonged wet conditions', 'Heavy rainfall can leach nutrients from soil']
      });
    }

    // ET analysis
    const avgET = recentData.reduce((sum, d) => sum + d.evapotranspiration, 0) / recentData.length;
    if (avgET > 0.3) {
      insights.push({
        id: `local-et-${Date.now()}`,
        chartType: 'evapotranspiration',
        title: '💨 High evapotranspiration detected - crops losing water quickly',
        insight: `Here's what's happening - crops are losing about ${avgET.toFixed(2)} inches of water per day right now, which is quite high! Think of it like plants are working overtime to stay cool because it's hot, windy, or very dry. They're managing heat stress, but that means they need more irrigation than typical conditions.`,
        recommendation: `Farmers should consider increasing irrigation duration by about 25% during these conditions. For example, extending a 20-minute watering cycle to 25 minutes, or adding a supplemental light irrigation session. This helps plants cope with high atmospheric demand - like providing extra hydration during intense physical activity! 😊`,
        confidence: 80,
        severity: 'medium',
        category: 'watering',
        actionItems: [
          'Increase irrigation duration by 25% to match higher water demand',
          'Consider adding light midday irrigation or misting if feasible',
          'Apply mulch to reduce soil water loss and help retain moisture',
          'Increase soil moisture monitoring frequency to twice daily'
        ],
        estimatedSavings: undefined,
        riskFactors: ['Water stress can reduce crop yields during high ET periods', 'Inadequate irrigation may result in smaller fruit development', 'Sustained water stress affects overall crop quality']
      });
    }

    // Crop stage-specific insights
    if (context.currentStage.toLowerCase().includes('flowering')) {
      insights.push({
        id: `local-flowering-${Date.now()}`,
        chartType: 'crop-stage',
        title: '🌸 Critical flowering period - optimal water management essential',
        insight: `Excellent timing observation! ${context.cropType} crops are in the flowering stage right now, which is crucial for fruit development. During flowering, plants are particularly sensitive to water stress and require consistent soil moisture. Water stress during this period can lead to flower drop and reduced fruit set.`,
        recommendation: `Farmers should prioritize maintaining consistent soil moisture during flowering - aim for 60-70% soil moisture content. This stage requires the most careful water management of the entire growing season. Consistent, moderate irrigation is better than infrequent heavy watering. Think of it as providing steady, reliable support during the most critical development phase! 🌱`,
        confidence: 95,
        severity: 'high',
        category: 'timing',
        actionItems: [
          'Implement daily soil moisture monitoring during flowering period',
          'Maintain consistent irrigation schedule without gaps',
          'Respond immediately to soil dryness indicators',
          'Set up monitoring reminders to ensure consistent attention'
        ],
        estimatedSavings: undefined,
        riskFactors: ['Flower drop risk increases with water stress', 'Poor fruit set directly impacts harvest yields', 'Flowering stage stress affects seasonal production potential']
      });
    }

    return insights.length > 0 ? insights : [{
      id: `local-default-${Date.now()}`,
      chartType: 'general',
      title: '✨ Conditions look favorable for continued growth',
      insight: `Great news! Weather conditions have been cooperative lately, and crops appear to be performing well. Sometimes stable conditions are exactly what farmers want - it indicates good management practices are working and environmental factors are supporting healthy plant development. 🌿`,
      recommendation: `Farmers should continue current management practices that are proving successful. Maintaining the existing irrigation routine makes sense while staying alert to weather changes that might require adjustments. Consistent monitoring and gradual refinements help optimize crop performance! 👍`,
      confidence: 70,
      severity: 'low',
      category: 'watering',
      actionItems: [
        'Continue successful current management practices',
        'Monitor weather forecasts for potential changes requiring adjustment',
        'Maintain established irrigation schedule that\'s proving effective',
        'Document successful practices for future reference 🎉'
      ]
    }];
  }
}

// Main AI Insights Service
export class AIInsightsService {
  private providers: Map<string, AIProvider> = new Map();
  private currentProvider: string = 'local';

  constructor() {
    // Initialize providers
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('local', new LocalInsightsProvider());
  }

  getAvailableProviders(): { id: string; name: string; configured: boolean }[] {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      name: provider.getName(),
      configured: provider.isConfigured()
    }));
  }

  setProvider(providerId: string): boolean {
    if (this.providers.has(providerId)) {
      this.currentProvider = providerId;
      return true;
    }
    return false;
  }

  async generateInsights(context: InsightContext): Promise<CropInsight[]> {
    const provider = this.providers.get(this.currentProvider);
    
    if (!provider) {
      throw new Error(`Provider ${this.currentProvider} not found`);
    }

    if (!provider.isConfigured() && this.currentProvider !== 'local') {
      console.warn(`Provider ${this.currentProvider} not configured, falling back to local analysis`);
      const localProvider = this.providers.get('local')!;
      return await localProvider.generateInsights(context);
    }

    return await provider.generateInsights(context);
  }

  getCurrentProvider(): string {
    return this.currentProvider;
  }
}

// Singleton instance
export const aiInsightsService = new AIInsightsService();