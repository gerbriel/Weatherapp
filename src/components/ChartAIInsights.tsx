import React, { useState, useEffect } from 'react';
import { Brain, ChevronDown, ChevronUp, BarChart3, TrendingUp, Droplets, Sun, Target, AlertTriangle } from 'lucide-react';
import { aiInsightsService, type InsightContext } from '../services/aiInsightsService';

export type ChartType = 'precipitation' | 'evapotranspiration' | 'weather-summary' | 'crop-water-use' | 'etc-comparison';

interface ChartAIInsightsProps {
  chartType: ChartType;
  chartData: any;
  cropType?: string;
  cropTypes?: string[]; // For multi-crop analysis
  location?: string;
  className?: string;
  compact?: boolean;
  enabledLineTypes?: { etc: boolean; eto: boolean; kc: boolean }; // For dynamic analysis based on active presets
}

interface ChartInsightData {
  title: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
  confidence: number;
}

export const ChartAIInsights: React.FC<ChartAIInsightsProps> = ({
  chartType,
  chartData,
  cropType = 'Mixed Crops',
  cropTypes = [],
  location = 'Field Location',
  className = '',
  compact = true,
  enabledLineTypes = { etc: true, eto: true, kc: true }
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [insights, setInsights] = useState<ChartInsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chartConfig = {
    precipitation: {
      icon: Droplets,
      title: 'Precipitation Analysis',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    evapotranspiration: {
      icon: Sun,
      title: 'ET₀ Analysis', 
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    'weather-summary': {
      icon: BarChart3,
      title: 'Weather Summary',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    'crop-water-use': {
      icon: TrendingUp,
      title: 'Crop Water Use',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    'etc-comparison': {
      icon: Target,
      title: 'ETC vs ETO Analysis',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    }
  };

  const config = chartConfig[chartType];
  const IconComponent = config.icon;

  const analyzeChartData = (type: ChartType, data: any): ChartInsightData => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return getDefaultChartInsight(type);
    }

    switch (type) {
      case 'precipitation':
        return analyzePrecipitationData(data);
      case 'evapotranspiration':
        return analyzeEvapotranspirationData(data);
      case 'weather-summary':
        return analyzeWeatherSummaryData(data);
      case 'crop-water-use':
        return analyzeCropWaterUseData(data);
      case 'etc-comparison':
        return analyzeETCComparisonData(data);
      default:
        return getDefaultChartInsight(type);
    }
  };

  const analyzePrecipitationData = (data: any[]): ChartInsightData => {
    const precipData = data.filter(d => d.precipitation !== undefined);
    if (precipData.length === 0) return getDefaultChartInsight('precipitation');

    const totalPrecip = precipData.reduce((sum, d) => sum + (d.precipitation || 0), 0);
    const avgPrecip = totalPrecip / precipData.length;
    const maxPrecip = Math.max(...precipData.map(d => d.precipitation || 0));
    const dryDays = precipData.filter(d => (d.precipitation || 0) < 0.01).length;
    const lightRainDays = precipData.filter(d => (d.precipitation || 0) >= 0.01 && (d.precipitation || 0) < 0.1).length;
    const moderateRainDays = precipData.filter(d => (d.precipitation || 0) >= 0.1 && (d.precipitation || 0) < 0.5).length;
    const heavyRainDays = precipData.filter(d => (d.precipitation || 0) >= 0.5).length;
    const timeframe = precipData.length;
    
    // Convert to practical irrigation equivalents
    const gallonsPerAcre = totalPrecip * 27154; // 1 inch = 27,154 gallons per acre
    const irrigationHours = totalPrecip / 0.04; // Assuming 0.04" per hour typical sprinkler rate
    const soilWaterDays = totalPrecip / 0.15; // Rough estimate: 0.15"/day plant water use
    
    // November seasonal context
    const novemberNormal = 2.1; // Typical November rainfall in many regions
    const deficit = novemberNormal - totalPrecip;

    let summary = `Precipitation Analysis: ${totalPrecip.toFixed(2)}" total rainfall over ${timeframe} days equals ${Math.round(gallonsPerAcre)} gallons per acre - equivalent to ${irrigationHours.toFixed(1)} hours of sprinkler irrigation or ${soilWaterDays.toFixed(1)} days of plant water needs.`;
    
    let insights = [];
    let recommendations = [];
    let riskFactors = [];

    if (totalPrecip > 3.0) {
      summary += ` This is exceptionally high rainfall for the period.`;
      insights.push(`� Heavy rainfall period: ${heavyRainDays} days with >0.5", ${moderateRainDays} days with 0.1-0.5", ${lightRainDays} light rain days`);
      insights.push(`� Peak event: ${maxPrecip.toFixed(2)}" in single day (${Math.round(maxPrecip * 27154)} gallons/acre)`);
      insights.push(`🏞️ Soil saturation: Ground likely at field capacity or beyond in most areas`);
      insights.push(`📊 Rain pattern: Only ${dryDays} completely dry days out of ${timeframe} total`);
      
      recommendations.push(`Stop all irrigation immediately - soil is oversaturated (${Math.round(gallonsPerAcre)} gal/acre received)`);
      recommendations.push(`Check field drainage systems and clear any blockages to prevent ponding`);
      recommendations.push(`Wait 3-5 days after rain stops before resuming irrigation schedule`);
      recommendations.push(`Focus on field access timing - avoid compaction when soil is saturated`);
      
      riskFactors.push(`Root rot and fungal diseases thrive in oversaturated soil conditions`);
      riskFactors.push(`Nutrient leaching: Heavy rains wash nitrogen and potassium below root zone`);
      riskFactors.push(`Soil compaction risk if equipment operates on saturated ground`);
      riskFactors.push(`Anaerobic conditions: Roots suffocate when soil pores stay water-filled`);
      
    } else if (totalPrecip < 0.3) {
      const deficitAmount = deficit > 0 ? deficit.toFixed(2) : "0";
      summary += ` This is very dry - plants are relying entirely on irrigation.`;
      insights.push(`🏜️ Drought conditions: ${dryDays} out of ${timeframe} days with no rain (${((dryDays/timeframe)*100).toFixed(0)}%)`);
      insights.push(`💧 Minimal moisture: Only ${lightRainDays + moderateRainDays} days provided any measurable water`);
      insights.push(`📉 Severe deficit: Need ${deficitAmount}" more to reach typical November levels`);
      insights.push(`⚡ Irrigation dependency: 100% of plant water needs must come from your system`);
      
      recommendations.push(`Increase irrigation by 40-50% to replace missing rainfall (need ${Math.round((deficit > 0 ? deficit : 1.5) * 27154)} gal/acre)`);
      recommendations.push(`Switch to deep, infrequent watering - apply 1-1.5" per session, every 3-4 days`);
      recommendations.push(`Add mulch around plants to reduce evaporation from soil surface`);
      recommendations.push(`Monitor soil moisture daily at 6" and 12" depths during dry periods`);
      
      riskFactors.push(`Rapid plant stress: Crops can wilt within 24-48 hours without irrigation`);
      riskFactors.push(`Root zone depletion: Deep soil moisture reserves being exhausted`);
      riskFactors.push(`Salt accumulation: Lack of rainfall allows salts to concentrate in root zone`);
      riskFactors.push(`Yield impact: Prolonged drought stress during critical growth stages reduces harvest`);
      
    } else if (totalPrecip > 1.5 && totalPrecip <= 3.0) {
      summary += ` Good natural irrigation - close to seasonal normal.`;
      insights.push(`🌧️ Balanced rainfall: ${moderateRainDays} moderate rain days, ${lightRainDays} light showers, ${heavyRainDays} heavy days`);
      insights.push(`💚 Soil moisture boost: Received ${((totalPrecip/novemberNormal)*100).toFixed(0)}% of typical November rainfall`);
      insights.push(`📊 Rain distribution: ${dryDays} dry days allows soil to breathe between events`);
      insights.push(`🎯 Efficient moisture: ${Math.round(gallonsPerAcre)} gallons/acre reduces irrigation needs significantly`);
      
      recommendations.push(`Reduce irrigation frequency by 30-40% - nature provided ${irrigationHours.toFixed(1)} hours worth`);
      recommendations.push(`Skip next 1-2 scheduled irrigation cycles and monitor soil moisture`);
      recommendations.push(`Use this dry period to perform system maintenance while demand is lower`);
      recommendations.push(`Resume normal schedule gradually as soil moisture decreases`);
      
      riskFactors.push(`Don't get complacent - weather patterns can change quickly`);
      riskFactors.push(`Monitor for fungal pressure if humidity remains high after rains`);
      riskFactors.push(`Soil moisture varies across field - check multiple locations`);
      
    } else {
      summary += ` Moderate precipitation - supplemental irrigation still needed.`;
      insights.push(`⚖️ Partial coverage: ${moderateRainDays + heavyRainDays} significant rain days provided some relief`);
      insights.push(`📊 Mixed conditions: ${dryDays} dry days between ${lightRainDays + moderateRainDays + heavyRainDays} wet days`);
      insights.push(`� Irrigation supplement: Natural rainfall covers ${((totalPrecip/1.5)*100).toFixed(0)}% of typical plant needs`);
      
      recommendations.push(`Reduce irrigation by 20-25% to account for ${totalPrecip.toFixed(2)}" of natural water`);
      recommendations.push(`Adjust timing based on recent rain - water 2-3 days after significant events`);
      recommendations.push(`Monitor soil at multiple depths to optimize irrigation scheduling`);
      
      riskFactors.push(`Inconsistent moisture: Plants experience wet-dry cycles that can cause stress`);
      riskFactors.push(`Variable field conditions: Some areas may be wetter than others`);
    }

    return {
      title: 'Rainfall Impact Analysis',
      summary,
      insights,
      recommendations,
      riskFactors,
      confidence: 0.96
    };
  };

  const analyzeEvapotranspirationData = (data: any[]): ChartInsightData => {
    const etData = data.filter(d => d.et0 !== undefined);
    if (etData.length === 0) return getDefaultChartInsight('evapotranspiration');

    const avgET = etData.reduce((sum, d) => sum + (d.et0 || 0), 0) / etData.length;
    const maxET = Math.max(...etData.map(d => d.et0 || 0));
    const minET = Math.min(...etData.map(d => d.et0 || 0));
    const highETDays = etData.filter(d => (d.et0 || 0) > 0.008).length; // >0.008" = high for cool weather
    const veryHighETDays = etData.filter(d => (d.et0 || 0) > 0.012).length; // >0.012" = very high
    const timeframe = etData.length;
    const totalWaterDemand = etData.reduce((sum, d) => sum + (d.et0 || 0), 0);
    
    // Convert to more understandable units and context
    const gallonsPerAcre = totalWaterDemand * 27154; // Convert inches to gallons per acre
    const irrigationHours = totalWaterDemand / 0.04; // Assuming 0.04"/hour typical sprinkler rate

    let summary = `ET₀ Analysis: Plants lost ${totalWaterDemand.toFixed(3)}" of water to the atmosphere over ${timeframe} days (avg: ${avgET.toFixed(4)}"/day). That's equivalent to ${Math.round(gallonsPerAcre)} gallons per acre or ${irrigationHours.toFixed(1)} hours of typical sprinkler irrigation.`;
    
    let insights = [];
    let recommendations = [];
    let riskFactors = [];

    // Seasonal context for November
    const seasonalContext = avgET < 0.006 ? "very low for late fall" : avgET < 0.010 ? "typical for November" : "high for this time of year";
    
    if (avgET > 0.010) {
      summary += ` This is unusually high ET₀ for November - likely due to warm, dry, or windy conditions.`;
      insights.push(`🌡️ Unseasonable conditions: ${avgET.toFixed(4)}"/day is ${seasonalContext} (normal November: 0.003-0.008")`);
      insights.push(`� High atmospheric demand: Peak day pulled ${maxET.toFixed(4)}" (${Math.round(maxET * 27154)} gal/acre)`);
      insights.push(`� Rapid moisture loss: Plants are working hard to stay hydrated in these conditions`);
      insights.push(`📊 Demand pattern: ${veryHighETDays} very high days, ${highETDays} elevated days total`);
      
      recommendations.push(`Increase irrigation frequency - plants are losing ${Math.round(avgET * 27154)} gallons/acre daily`);
      recommendations.push(`Water early morning (5-6 AM) when ET₀ is lowest to maximize efficiency`);
      recommendations.push(`Consider windbreaks if persistent wind is driving high ET₀ values`);
      recommendations.push(`Monitor soil moisture 2x daily - high ET₀ can quickly deplete reserves`);
      
      riskFactors.push(`Rapid dehydration: Plants can go from healthy to stressed in 12-24 hours`);
      riskFactors.push(`Root zone drying: High ET₀ pulls water from deeper soil layers faster`);
      riskFactors.push(`Increased salinity risk: Rapid water loss concentrates salts in root zone`);
      
    } else if (avgET < 0.004) {
      summary += ` This is very low ET₀, even for November - cool, humid, or calm conditions.`;
      insights.push(`❄️ Low-demand period: ${avgET.toFixed(4)}"/day is ${seasonalContext} (plants barely transpiring)`);
      insights.push(`�️ Gentle conditions: Even peak day only ${maxET.toFixed(4)}" atmospheric pull`);
      insights.push(`� Water conservation: Plants using minimal water - good for water savings`);
      insights.push(`📉 Minimal stress: Only ${highETDays} days had any significant atmospheric demand`);
      
      recommendations.push(`Reduce irrigation frequency - plants only need ${Math.round(avgET * 27154)} gal/acre daily`);
      recommendations.push(`Focus on deep, infrequent watering to encourage root growth`);
      recommendations.push(`Good time for system maintenance while water demand is low`);
      recommendations.push(`Watch for oversaturation - low ET₀ means slow soil drying`);
      
      riskFactors.push(`Root rot risk: Low ET₀ + irrigation can create soggy conditions`);
      riskFactors.push(`Sudden changes: Weather shifts can quickly increase water demand`);
      riskFactors.push(`Fungal pressure: Cool, moist conditions favor disease development`);
      
    } else {
      insights.push(`🌤️ Typical November ET₀: ${avgET.toFixed(4)}"/day is ${seasonalContext} for this season`);
      insights.push(`📊 Steady demand: Range from ${minET.toFixed(4)}" to ${maxET.toFixed(4)}" shows stable conditions`);
      insights.push(`⚖️ Balanced period: ${highETDays} days above average, ${timeframe - highETDays} days below`);
      insights.push(`🎯 Efficient timing: Plants using water at sustainable, predictable rates`);
      
      recommendations.push(`Maintain current irrigation - ${Math.round(avgET * 27154)} gal/acre daily is appropriate`);
      recommendations.push(`Standard schedule works: Every 2-3 days irrigation likely adequate`);
      recommendations.push(`Monitor for seasonal changes as winter approaches`);
      
      riskFactors.push(`Seasonal transition: ET₀ will continue dropping as temperatures fall`);
      riskFactors.push(`Weather variability: November can have sudden warm or cool spells`);
    }

    // Add practical irrigation guidance
    const irrigationNeeded = totalWaterDemand.toFixed(3);
    insights.push(`💡 Practical context: This ${irrigationNeeded}" equals ${Math.round(irrigationHours)} minutes of drip irrigation or ${Math.round(irrigationHours * 60 / 24)} minutes daily`);

    return {
      title: 'ET₀ Deep Analysis',
      summary,
      insights,
      recommendations,
      riskFactors,
      confidence: 0.94
    };
  };

  const analyzeWeatherSummaryData = (data: any[]): ChartInsightData => {
    if (data.length === 0) return getDefaultChartInsight('weather-summary');

    const temps = data.map(d => d.temperature || 0).filter(t => t > 0);
    const humidity = data.map(d => d.humidity || 0).filter(h => h > 0);
    const precipitation = data.reduce((sum, d) => sum + (d.precipitation || 0), 0);
    const et = data.reduce((sum, d) => sum + (d.evapotranspiration || 0), 0);
    
    if (temps.length === 0) {
      // Handle case where we have no temperature data
      return {
        title: 'Weather Summary Analysis',
        summary: `Weather data incomplete - unable to analyze temperature patterns over ${data.length} days.`,
        insights: ['📊 Temperature data missing or invalid in chart dataset', '🔄 Refresh data or check weather station connectivity'],
        recommendations: ['Verify weather data source and try reloading the charts'],
        riskFactors: ['Cannot make irrigation decisions without reliable weather data'],
        confidence: 0.3
      };
    }

    const avgTemp = temps.reduce((sum, t) => sum + t, 0) / temps.length;
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const avgHumidity = humidity.length > 0 ? humidity.reduce((sum, h) => sum + h, 0) / humidity.length : 0;
    const timeframe = data.length;
    
    // Calculate temperature variability and stress days
    const tempRange = maxTemp - minTemp;
    const hotDays = temps.filter(t => t > 85).length;
    const coolDays = temps.filter(t => t < 60).length;
    const idealDays = temps.filter(t => t >= 65 && t <= 80).length;
    
    // Growing degree days calculation (base 50°F)
    const gdd = temps.reduce((sum, t) => sum + Math.max(0, t - 50), 0);
    const avgGDD = gdd / temps.length;
    
    // Humidity analysis
    const highHumidityDays = humidity.filter(h => h > 80).length;
    const lowHumidityDays = humidity.filter(h => h < 40).length;
    
    // Seasonal context for November
    const novemberTempNormal = 65; // Typical November average
    const tempDifference = avgTemp - novemberTempNormal;
    
    let summary = `Weather Comprehensive Analysis: Over ${timeframe} days, temperatures averaged ${avgTemp.toFixed(1)}°F (${tempDifference >= 0 ? '+' : ''}${tempDifference.toFixed(1)}° vs November normal), ranging ${tempRange}°F from ${minTemp}° to ${maxTemp}°F. Humidity averaged ${avgHumidity.toFixed(0)}%. Total precipitation: ${precipitation.toFixed(2)}" (${(precipitation * 27154).toFixed(0)} gal/acre). Combined ET demand: ${et.toFixed(3)}" (${(et * 27154).toFixed(0)} gal/acre).`;
    
    let insights = [];
    let recommendations = [];
    let riskFactors = [];

    // Temperature pattern analysis
    if (tempDifference > 10) {
      insights.push(`🔥 Unseasonably warm: ${avgTemp.toFixed(1)}°F average is ${tempDifference.toFixed(1)}° above November normal`);
      insights.push(`☀️ Extended warm period: ${hotDays} days exceeded 85°F, only ${coolDays} cool days below 60°F`);
      insights.push(`📈 High growing degree days: ${gdd.toFixed(0)} total GDD (${avgGDD.toFixed(1)} daily average)`);
      insights.push(`🌡️ Temperature stress: ${tempRange}°F daily variation from ${minTemp}° to ${maxTemp}°F`);
      
      recommendations.push(`Increase irrigation frequency 25-30% to match elevated temperature demand`);
      recommendations.push(`Schedule irrigation during coolest parts of day (4-6 AM) to maximize efficiency`);
      recommendations.push(`Consider heat stress protection during peak temperature periods`);
      recommendations.push(`Monitor plant stress signs: wilting, leaf curl, reduced growth during hot afternoons`);
      
      riskFactors.push(`Heat stress accumulation: Prolonged warm weather exhausts plant energy reserves`);
      riskFactors.push(`Accelerated crop development: Higher GDD may advance growth stages faster than expected`);
      riskFactors.push(`Increased pest pressure: Warm conditions accelerate insect reproduction cycles`);
      
    } else if (tempDifference < -8) {
      insights.push(`❄️ Cooler than normal: ${avgTemp.toFixed(1)}°F average is ${Math.abs(tempDifference).toFixed(1)}° below November typical`);
      insights.push(`🌤️ Extended cool period: ${coolDays} days below 60°F, only ${hotDays} warm days above 85°F`);
      insights.push(`📉 Low growing degree days: ${gdd.toFixed(0)} total GDD (${avgGDD.toFixed(1)} daily average)`);
      insights.push(`🥶 Growth slowdown: ${idealDays} out of ${timeframe} days in optimal 65-80°F range`);
      
      recommendations.push(`Reduce irrigation frequency 20-25% as plant water demand is lower`);
      recommendations.push(`Focus on deeper, less frequent watering to encourage root development`);
      recommendations.push(`Extend irrigation intervals since evapotranspiration is reduced in cool weather`);
      recommendations.push(`Monitor for cold stress signs and protect sensitive crops if needed`);
      
      riskFactors.push(`Slow growth rate: Cool temperatures delay crop development and harvest timing`);
      riskFactors.push(`Fungal disease pressure: Cool, moist conditions favor pathogen development`);
      riskFactors.push(`Reduced nutrient uptake: Cool soil temperatures limit root nutrient absorption`);
      
    } else {
      insights.push(`🌤️ Near-normal temperatures: ${avgTemp.toFixed(1)}°F average within ${Math.abs(tempDifference).toFixed(1)}° of November typical`);
      insights.push(`⚖️ Balanced conditions: ${idealDays} ideal days (65-80°F), ${hotDays} hot days, ${coolDays} cool days`);
      insights.push(`📊 Moderate GDD accumulation: ${gdd.toFixed(0)} total growing degree days`);
      insights.push(`🎯 Stable temperature pattern: ${tempRange}°F range shows consistent conditions`);
      
      recommendations.push(`Continue current irrigation schedule - temperature demand is seasonal-appropriate`);
      recommendations.push(`Standard irrigation timing (early morning) remains optimal`);
      recommendations.push(`Monitor for weather pattern changes as winter approaches`);
      recommendations.push(`Take advantage of stable conditions for field maintenance activities`);
      
      riskFactors.push(`Transition period: November weather can shift rapidly between seasons`);
      riskFactors.push(`Frost risk increasing: Monitor overnight temperatures as winter approaches`);
    }

    // Humidity impact analysis
    if (avgHumidity > 70) {
      insights.push(`💧 High humidity environment: ${avgHumidity.toFixed(0)}% average creates moisture-rich conditions`);
      insights.push(`🦠 Disease pressure elevated: ${highHumidityDays} days exceeded 80% humidity threshold`);
      
      recommendations.push(`Increase air circulation around plants to reduce fungal disease risk`);
      recommendations.push(`Apply preventive fungicide treatments if disease pressure is high`);
      recommendations.push(`Reduce irrigation frequency slightly - high humidity slows plant water loss`);
      
      riskFactors.push(`Fungal diseases thrive in sustained high humidity above 80%`);
      riskFactors.push(`Poor air circulation can create localized high-moisture microclimates`);
      
    } else if (avgHumidity < 40 && avgHumidity > 0) {
      insights.push(`🏜️ Low humidity stress: ${avgHumidity.toFixed(0)}% average increases plant water loss`);
      insights.push(`💨 Dry air conditions: ${lowHumidityDays} days below 40% humidity accelerate transpiration`);
      
      recommendations.push(`Increase irrigation frequency 15-20% to compensate for rapid water loss`);
      recommendations.push(`Consider misting systems during extremely dry periods`);
      recommendations.push(`Mulch around plants to maintain soil moisture in dry air`);
      
      riskFactors.push(`Rapid dehydration: Low humidity pulls moisture from plants faster`);
      riskFactors.push(`Leaf stress: Extended dry air can cause leaf edges to brown and curl`);
      
    } else if (avgHumidity > 0) {
      insights.push(`⚖️ Moderate humidity levels: ${avgHumidity.toFixed(0)}% average supports healthy plant transpiration`);
      insights.push(`🌿 Balanced moisture: ${highHumidityDays} high humidity days, ${lowHumidityDays} low humidity days`);
      
      recommendations.push(`Current humidity levels support standard irrigation practices`);
      recommendations.push(`Monitor for changes in humidity patterns that could affect irrigation needs`);
    }

    // Combined weather stress assessment
    const weatherStressScore = 
      (hotDays > timeframe * 0.3 ? 2 : 0) + 
      (coolDays > timeframe * 0.4 ? 1 : 0) + 
      (highHumidityDays > timeframe * 0.5 ? 1 : 0) + 
      (lowHumidityDays > timeframe * 0.3 ? 2 : 0) + 
      (precipitation < 0.3 ? 2 : 0);

    if (weatherStressScore >= 4) {
      insights.push(`⚠️ High weather stress period: Multiple challenging conditions present simultaneously`);
      riskFactors.push(`Cumulative weather stress can significantly impact crop health and yields`);
      recommendations.push(`Implement comprehensive stress mitigation: adjust irrigation, provide protection, monitor closely`);
    } else if (weatherStressScore >= 2) {
      insights.push(`⚡ Moderate weather challenges: Some stressful conditions requiring attention`);
      recommendations.push(`Make targeted adjustments to irrigation and crop management practices`);
    } else {
      insights.push(`✅ Favorable weather conditions: Minimal stress factors support healthy crop growth`);
      recommendations.push(`Maintain current management practices - weather is supporting good crop performance`);
    }

    // Practical irrigation guidance
    const irrigationMultiplier = 
      1 + (tempDifference > 5 ? 0.2 : 0) + 
      (avgHumidity < 45 ? 0.15 : 0) - 
      (tempDifference < -5 ? 0.2 : 0) - 
      (avgHumidity > 75 ? 0.1 : 0);
      
    insights.push(`🚰 Irrigation adjustment factor: Weather conditions suggest ${((irrigationMultiplier - 1) * 100).toFixed(0)}% ${irrigationMultiplier > 1 ? 'increase' : 'decrease'} from baseline schedule`);

    return {
      title: 'Comprehensive Weather Analysis',
      summary,
      insights,
      recommendations,
      riskFactors,
      confidence: 0.93
    };
  };

  const analyzeCropWaterUseData = (data: any[]): ChartInsightData => {
    if (data.length === 0) return getDefaultChartInsight('crop-water-use');

    // Determine if we're analyzing single or multiple crops
    const selectedCrops = cropTypes && cropTypes.length > 0 ? cropTypes : (cropType ? [cropType] : []);
    const isMultiCropAnalysis = selectedCrops.length > 1;

    // Extract crop water use values and organize by crop
    const cropWaterUseData: { [cropName: string]: number[] } = {};
    const waterUseValues = [];
    
    for (const dataPoint of data) {
      for (const [key, value] of Object.entries(dataPoint)) {
        if (key.includes('ETC') && typeof value === 'number' && value > 0) {
          // Extract crop name from key
          const fullCropName = key.replace('_ETC', '').replace('ETC_', '');
          // Extract crop type from the full name (e.g., "Almonds_Castroville" -> "almonds")
          const cropType = fullCropName.split('_')[0].toLowerCase();
          
          // Only include this crop if it's in the selected crops
          if (selectedCrops.length === 0 || selectedCrops.some(selected => selected.toLowerCase() === cropType)) {
            waterUseValues.push(value);
            
            if (!cropWaterUseData[fullCropName]) {
              cropWaterUseData[fullCropName] = [];
            }
            cropWaterUseData[fullCropName].push(value);
          }
        }
      }
    }

    if (waterUseValues.length === 0) {
      return {
        title: isMultiCropAnalysis ? 'Multi-Crop Water Use Analysis' : 'Crop Water Use Analysis',
        summary: `No crop water use data available for analysis in the selected timeframe.`,
        insights: ['📊 Add crop data to see detailed water use analysis'],
        recommendations: ['Set up crop tracking to enable water use insights'],
        riskFactors: ['Cannot optimize irrigation without crop-specific data'],
        confidence: 0.5
      };
    }

    const avgWaterUse = waterUseValues.reduce((sum, v) => sum + v, 0) / waterUseValues.length;
    const maxWaterUse = Math.max(...waterUseValues);
    const minWaterUse = Math.min(...waterUseValues);
    const timeframe = data.length;
    
    // Count actual analyzed crops (those with data)
    const analyzedCropsCount = Object.keys(cropWaterUseData).length;
    const actuallyMultiCrop = analyzedCropsCount > 1 || (selectedCrops.length > 1 && analyzedCropsCount >= 1); // Show multi-crop analysis if multiple crops selected

    // Debug info to help identify crops
    console.log('Multi-crop analysis debug:', {
      selectedCrops,
      analyzedCropsCount,
      cropWaterUseData: Object.keys(cropWaterUseData),
      actuallyMultiCrop,
      dataPointsCount: timeframe
    });

    let summary = actuallyMultiCrop 
      ? `Multi-crop water use analysis: ${analyzedCropsCount} crops with data (${Object.keys(cropWaterUseData).join(', ')}) over ${timeframe} data points, averaging ${avgWaterUse.toFixed(2)} mm/day, ranging from ${minWaterUse.toFixed(2)} to ${maxWaterUse.toFixed(2)} mm/day.`
      : `Single crop water use over ${timeframe} data points: averaging ${avgWaterUse.toFixed(2)} mm/day, ranging from ${minWaterUse.toFixed(2)} to ${maxWaterUse.toFixed(2)} mm/day.`;
    let insights = [];
    let recommendations = [];
    let riskFactors = [];

    if (actuallyMultiCrop) {
      // Multi-crop specific insights with individual crop breakdown
      const cropNames = Object.keys(cropWaterUseData);
      const cropAverages = cropNames.map(crop => {
        const values = cropWaterUseData[crop];
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const trend = values.length > 1 ? calculateTrend(values) : 0;
        const cropType = crop.split('_')[0].toUpperCase();
        return { name: crop, cropType, avg, max, min, trend };
      });
      
      cropAverages.sort((a, b) => b.avg - a.avg);
      
      // Add individual crop header
      insights.push(`INDIVIDUAL CROP ANALYSIS - ${analyzedCropsCount} crops with detailed breakdown:`);
      
      // Add individual crop insights for each selected crop
      cropAverages.forEach((crop, index) => {
        const trendText = crop.trend > 0.05 ? '↗ increasing' : crop.trend < -0.05 ? '↘ decreasing' : '→ stable';
        const waterCategory = crop.avg > 6 ? '[HIGH DEMAND]' : crop.avg > 3 ? '[MODERATE USE]' : '[EFFICIENT]';
        const displayName = crop.name.replace(/_/g, ' ').toUpperCase();
        
        insights.push(`    ${index + 1}. ${displayName}: ${waterCategory} - ${crop.avg.toFixed(2)} mm/day average (${crop.min.toFixed(1)}-${crop.max.toFixed(1)} range) ${trendText}`);
      });
      
      // Add comparative insights
      insights.push(`[HIGHEST DEMAND] ${cropAverages[0].cropType} at ${cropAverages[0].avg.toFixed(2)} mm/day requires priority irrigation scheduling`);
      insights.push(`[MOST EFFICIENT] ${cropAverages[cropAverages.length - 1].cropType} at ${cropAverages[cropAverages.length - 1].avg.toFixed(2)} mm/day offers water conservation opportunities`);
      insights.push(`[WATER USE SPREAD] ${((cropAverages[0].avg - cropAverages[cropAverages.length - 1].avg) / cropAverages[0].avg * 100).toFixed(0)}% difference between most and least water-intensive crops`);
      
      // Add individual crop recommendations header
      recommendations.push(`INDIVIDUAL CROP IRRIGATION SCHEDULES:`);
      
      // Individual crop recommendations
      cropAverages.forEach((crop, index) => {
        const displayName = crop.name.replace(/_/g, ' ').toUpperCase();
        if (crop.avg > 5) {
          recommendations.push(`    ${index + 1}. ${displayName}: Schedule irrigation 4-6 AM daily - HIGH DEMAND crop needs priority watering`);
        } else if (crop.avg < 3) {
          recommendations.push(`    ${index + 1}. ${displayName}: Water deeply every 2-3 days - EFFICIENT crop conserves water`);
        } else {
          recommendations.push(`    ${index + 1}. ${displayName}: Standard schedule every 2 days - MODERATE water use pattern`);
        }
      });
      
      // Farm-wide recommendations
      recommendations.push(`Zone irrigation system: Group ${cropAverages.filter(c => c.avg > 4).map(c => c.cropType).join(', ')} (high-demand) vs ${cropAverages.filter(c => c.avg <= 4).map(c => c.cropType).join(', ')} (efficient) zones`);
      recommendations.push(`Water allocation priority: During shortages, prioritize ${cropAverages.slice(0, Math.ceil(cropAverages.length/3)).map(c => c.cropType).join(', ')} over ${cropAverages.slice(-Math.ceil(cropAverages.length/3)).map(c => c.cropType).join(', ')}`);
      
      // Individual crop risk factors
      cropAverages.forEach(crop => {
        if (crop.trend > 0.1) {
          riskFactors.push(`${crop.cropType}: Rapidly increasing water demand (${(crop.trend * 100).toFixed(0)}% daily increase) may stress irrigation capacity`);
        }
        if (crop.avg > cropAverages[cropAverages.length - 1].avg * 2.5) {
          riskFactors.push(`${crop.cropType}: Extremely high water use compared to other crops may indicate stress or inefficient irrigation`);
        }
      });
      
      if (cropAverages[0].avg > cropAverages[cropAverages.length - 1].avg * 2) {
        riskFactors.push(`Large water use variation between crops may lead to over/under watering without zone-based irrigation management`);
      }
    } else {
      // Single crop insights
      if (avgWaterUse > 6) {
        insights.push(`🚰 High water demand period: Crops using ${avgWaterUse.toFixed(2)} mm/day on average`);
        insights.push(`📈 Peak usage: ${maxWaterUse.toFixed(2)} mm/day during highest demand period`);
        recommendations.push(`Ensure irrigation system capacity can meet peak demands`);
        recommendations.push(`Consider deficit irrigation strategies for less critical growth stages`);
        riskFactors.push(`Water shortage risk during peak demand periods`);
      } else if (avgWaterUse < 3) {
        insights.push(`💧 Moderate water use: Crops using ${avgWaterUse.toFixed(2)} mm/day - efficient period`);
        insights.push(`📉 Conservative demand: Maximum daily use only ${maxWaterUse.toFixed(2)} mm/day`);
        recommendations.push(`Good time for deep watering to build soil reserves`);
        recommendations.push(`Monitor for increased demand as conditions change`);
      } else {
        insights.push(`⚖️ Typical water use: ${avgWaterUse.toFixed(2)} mm/day average within normal range`);
        insights.push(`📊 Variation: ${(maxWaterUse - minWaterUse).toFixed(2)} mm/day difference between peak and low`);
        recommendations.push(`Current irrigation strategy appears well-matched to crop needs`);
      }
    }

    return {
      title: actuallyMultiCrop ? 'Multi-Crop Water Use Comparison' : 'Crop Water Use Analysis',
      summary,
      insights,
      recommendations,
      riskFactors,
      confidence: 0.88
    };
  };

  const analyzeETCComparisonData = (data: any[]): ChartInsightData => {
    if (data.length === 0) return getDefaultChartInsight('etc-comparison');

    // Determine if we're analyzing single or multiple crops
    const selectedCrops = cropTypes && cropTypes.length > 0 ? cropTypes : (cropType ? [cropType] : []);
    const isMultiCropAnalysis = selectedCrops.length > 1;
    
    // Dynamic analysis context based on enabled line types
    const enabledTypes = enabledLineTypes || { etc: true, eto: true, kc: true };
    const activeTypes = [];
    if (enabledTypes.etc) activeTypes.push('ETC');
    if (enabledTypes.eto) activeTypes.push('ETO');
    if (enabledTypes.kc) activeTypes.push('KC');
    const analysisContext = activeTypes.join(' + ');

    // Handle case when no crops are selected
    if (selectedCrops.length === 0) {
      // Determine if data types are selected to provide better guidance
      const hasActivePresets = activeTypes.length > 0;
      const presetStatus = hasActivePresets ? `${analysisContext} ready for analysis` : 'No data types selected';
      
      return {
        title: `📊 Irrigation Analysis - ${hasActivePresets ? 'Select Crops' : 'Select Crops and Data Types'}`,
        summary: hasActivePresets 
          ? `${analysisContext} analysis ready - select crops from above to view irrigation insights. Currently configured for ${analysisContext.toLowerCase()} analysis.`
          : `No crops or data types selected. Choose crops from the selection above and enable ETC (crop water use), ETO (atmospheric demand), and/or KC (crop coefficient) to view comprehensive irrigation insights.`,
        insights: hasActivePresets ? [
          `🌾 ${analysisContext} analysis is ready - select crops above to begin`,
          '📊 Chart will update immediately when crops are selected',
          '🔄 Analysis will focus on the selected data types above',
          '🎯 Multi-select crops for comparative irrigation strategy',
          '💡 Deselect/select crops anytime to refine analysis scope'
        ] : [
          '🌾 Select crops above to begin irrigation analysis',
          '📊 Choose ETC to see crop water consumption patterns',
          '🌡️ Enable ETO to view atmospheric water demand trends',
          '🔢 Add KC to understand crop coefficient efficiency',
          '🎯 Multi-select crops and data types for complete strategy'
        ],
        recommendations: hasActivePresets ? [
          'Click on crop names in the selection area above to add them to analysis',
          `Current ${analysisContext} configuration will analyze selected crops immediately`,
          'Use crop checkboxes to compare multiple varieties side-by-side',
          'Toggle crops on/off to focus analysis on specific varieties',
          'Select "Show All" to analyze all available crops at once'
        ] : [
          'Select one or more crops from the crop selection area above',
          'Enable relevant data types (ETC, ETO, KC) using the preset buttons',
          'Start with ETC analysis for immediate irrigation needs',
          'Add ETO data for weather-responsive irrigation planning',
          'Include KC analysis for growth stage optimization'
        ],
        riskFactors: [
          'Cannot provide irrigation guidance without crop selection',
          hasActivePresets ? `${analysisContext} analysis waiting for crop data` : 'Missing both crop selection and data type configuration',
          'Select crops to unlock precision agriculture insights'
        ],
        confidence: hasActivePresets ? 0.3 : 0.1
      };
    }

    // Handle case when no data types are selected
    if (activeTypes.length === 0) {
      const cropName = selectedCrops.length > 0 ? selectedCrops[0] : 'Crop';
      const cropsList = selectedCrops.length > 1 ? selectedCrops.join(', ') : cropName;
      
      return {
        title: selectedCrops.length > 1 ? `📊 ${cropsList} - No Analysis Selected` : `📊 ${cropName} Analysis - Select Data Types`,
        summary: `No irrigation data types selected. Choose ETC (crop water use), ETO (atmospheric demand), and/or KC (crop coefficient) to view ${selectedCrops.length > 1 ? 'multi-crop' : cropName} analysis and irrigation recommendations.`,
        insights: [
          '📊 ETC shows actual crop water consumption and irrigation needs',
          '🌡️ ETO reveals atmospheric water demand from weather conditions', 
          '🔢 KC indicates crop coefficient and growth stage efficiency',
          '⚖️ Combining all three provides complete irrigation optimization',
          '🎯 Select any combination above to see targeted analysis'
        ],
        recommendations: [
          'Click ETC button to see crop water consumption analysis',
          'Click ETO button to view atmospheric demand trends', 
          'Click KC button to understand crop coefficient patterns',
          'Select multiple types for comprehensive irrigation strategy',
          'Use multi-select to compare different water balance factors'
        ],
        riskFactors: [
          'Cannot provide irrigation timing without data type selection',
          'Missing analysis may lead to suboptimal watering decisions',
          'Select at least one data type to unlock irrigation insights'
        ],
        confidence: 0.2
      };
    }

    // Extract ETC, ETO, and KC values with time series support
    let etcValues = data.map(d => d.ETC || 0).filter(v => v > 0);
    let etoValues = data.map(d => d.ETO || 0).filter(v => v > 0);
    let kcValues = data.map(d => d.KC || 0).filter(v => v > 0);
    
    // Time series data for trend analysis
    const timeSeriesData = [];
    
    // If no simple values found, extract from complex keys (time-series data)
    if (etcValues.length === 0 || etoValues.length === 0) {
      const allEtcValues = [];
      const allEtoValues = [];
      const allKcValues = [];
      
      for (const dataPoint of data) {
        const point = { date: dataPoint.date, etc: 0, eto: 0, kc: 0, etcSum: 0, count: 0 };
        
        for (const [key, value] of Object.entries(dataPoint)) {
          if (typeof value === 'number' && value > 0) {
            if (key.includes('ETC') && !key.includes('ETO')) {
              const cropType = key.split('_')[0].toLowerCase();
              if (selectedCrops.length === 0 || selectedCrops.some(selected => selected.toLowerCase() === cropType)) {
                allEtcValues.push(value);
                point.etcSum += value;
                point.count++;
              }
            } else if (key.includes('ETO')) {
              const cropType = key.split('_')[0].toLowerCase();
              if (selectedCrops.length === 0 || selectedCrops.some(selected => selected.toLowerCase() === cropType)) {
                allEtoValues.push(value);
                point.eto = value;
              }
            } else if (key.includes('KC')) {
              const cropType = key.split('_')[0].toLowerCase();
              if (selectedCrops.length === 0 || selectedCrops.some(selected => selected.toLowerCase() === cropType)) {
                allKcValues.push(value);
              }
            }
          }
        }
        
        if (point.count > 0) {
          point.etc = point.etcSum / point.count;
          point.kc = point.eto > 0 ? point.etc / point.eto : 0;
          timeSeriesData.push(point);
        }
      }
      
      if (allEtcValues.length > 0) etcValues = allEtcValues;
      if (allEtoValues.length > 0) etoValues = allEtoValues;
      if (allKcValues.length > 0) kcValues = allKcValues;
    }

    // For multi-crop analysis, extract crop-specific data
    const cropETCData: { [cropName: string]: number[] } = {};
    const cropKCData: { [cropName: string]: number[] } = {};

    if (isMultiCropAnalysis) {
      for (const dataPoint of data) {
        for (const [key, value] of Object.entries(dataPoint)) {
          if (typeof value === 'number' && value > 0) {
            if (key.includes('ETC') && !key.includes('ETO')) {
              const fullCropName = key.replace('_ETC', '').replace('ETC_', '');
              const cropType = fullCropName.split('_')[0].toLowerCase();
              
              if (selectedCrops.length === 0 || selectedCrops.some(selected => selected.toLowerCase() === cropType)) {
                if (!cropETCData[fullCropName]) cropETCData[fullCropName] = [];
                cropETCData[fullCropName].push(value);
              }
            } else if (key.includes('KC')) {
              const fullCropName = key.replace('_KC', '').replace('KC_', '');
              const cropType = fullCropName.split('_')[0].toLowerCase();
              
              if (selectedCrops.length === 0 || selectedCrops.some(selected => selected.toLowerCase() === cropType)) {
                if (!cropKCData[fullCropName]) cropKCData[fullCropName] = [];
                cropKCData[fullCropName].push(value);
              }
            }
          }
        }
      }
    }

    if (etcValues.length === 0 || etoValues.length === 0) {
      return {
        title: 'ETC vs ETO Analysis - Data Loading',
        summary: 'Insufficient data available for comprehensive irrigation analysis.',
        insights: ['📊 Waiting for both crop water use (ETC) and atmospheric demand (ETO) data'],
        recommendations: ['Check data source connections and crop coefficient calculations'],
        riskFactors: ['Cannot provide irrigation recommendations without complete water balance data'],
        confidence: 0.4
      };
    }

    // Advanced statistical analysis
    const avgETC = etcValues.reduce((sum, v) => sum + v, 0) / etcValues.length;
    const avgETO = etoValues.reduce((sum, v) => sum + v, 0) / etoValues.length;
    const avgKC = kcValues.length > 0 ? kcValues.reduce((sum, v) => sum + v, 0) / kcValues.length : avgETC / avgETO;
    
    const maxETC = Math.max(...etcValues);
    const minETC = Math.min(...etcValues);
    const maxETO = Math.max(...etoValues);
    const minETO = Math.min(...etoValues);
    
    // Trend analysis
    const etcTrend = calculateTrend(etcValues);
    const etoTrend = calculateTrend(etoValues);
    const kcTrend = timeSeriesData.length > 1 ? calculateTrend(timeSeriesData.map(d => d.kc)) : 0;
    
    // Water stress indicators
    const waterStressDays = timeSeriesData.filter(d => d.kc > 1.3 && d.eto > avgETO * 1.2).length;
    const efficientDays = timeSeriesData.filter(d => d.kc >= 0.8 && d.kc <= 1.2).length;
    const conservationDays = timeSeriesData.filter(d => d.kc < 0.8).length;
    
    // Irrigation demand calculations
    const totalWaterNeeded = etcValues.reduce((sum, v) => sum + v, 0); // mm over period
    const totalAtmosphericDemand = etoValues.reduce((sum, v) => sum + v, 0);
    const waterUseEfficiency = (totalWaterNeeded / totalAtmosphericDemand) * 100;
    const dailyIrrigationNeeds = avgETC * 0.0394; // Convert mm to inches
    const weeklyIrrigationNeeds = dailyIrrigationNeeds * 7;
    
    // Peak demand analysis
    const peakDemandDays = etcValues.filter(v => v > avgETC * 1.3).length;
    const lowDemandDays = etcValues.filter(v => v < avgETC * 0.7).length;
    
    const analyzedETCCropsCount = Object.keys(cropETCData).length;
    const actuallyMultiCropETC = analyzedETCCropsCount > 1;
    
    // Dynamic summary based on selected line types and crops
    let summary;
    const cropNames = selectedCrops.length > 0 ? selectedCrops.join(', ') : 'Selected crops';
    
    if (actuallyMultiCropETC) {
      // Multi-crop dynamic summary
      if (activeTypes.length === 3) {
        summary = `Complete water analysis for ${cropNames}: ${analyzedETCCropsCount} crops averaging ${avgETC.toFixed(2)}mm/day vs ${avgETO.toFixed(2)}mm/day atmospheric demand (Kc: ${avgKC.toFixed(2)}, ${waterUseEfficiency.toFixed(0)}% efficiency). Apply ${weeklyIrrigationNeeds.toFixed(2)}" weekly.`;
      } else if (enabledTypes.etc && enabledTypes.eto && !enabledTypes.kc) {
        summary = `${cropNames} water demand vs atmospheric conditions: Crop needs ${avgETC.toFixed(2)}mm/day while atmosphere demands ${avgETO.toFixed(2)}mm/day (${((avgETC/avgETO)*100).toFixed(0)}% ratio). Irrigation: ${weeklyIrrigationNeeds.toFixed(2)}"/week.`;
      } else if (enabledTypes.etc && !enabledTypes.eto && enabledTypes.kc) {
        summary = `${cropNames} water use efficiency: ETC ${avgETC.toFixed(2)}mm/day with crop coefficient ${avgKC.toFixed(2)}. Current irrigation needs: ${weeklyIrrigationNeeds.toFixed(2)}" per week across ${analyzedETCCropsCount} crops.`;
      } else if (!enabledTypes.etc && enabledTypes.eto && enabledTypes.kc) {
        summary = `Atmospheric demand analysis for ${cropNames}: ETO ${avgETO.toFixed(2)}mm/day with average crop coefficient ${avgKC.toFixed(2)}. Expected crop demand: ${(avgETO * avgKC).toFixed(2)}mm/day.`;
      } else {
        const focusType = activeTypes[0];
        const focusValue = focusType === 'ETC' ? avgETC : focusType === 'ETO' ? avgETO : avgKC;
        summary = `${focusType} focus for ${cropNames}: Current ${focusType.toLowerCase()} averaging ${focusValue.toFixed(2)}${focusType === 'KC' ? '' : 'mm/day'} across ${analyzedETCCropsCount} crop varieties.`;
      }
    } else {
      // Single crop dynamic summary
      const cropName = selectedCrops[0] || 'Crop';
      const cropStage = avgKC > 1.2 ? 'peak growth' : avgKC < 0.8 ? 'early/late season' : 'active growth';
      
      if (activeTypes.length === 3) {
        summary = `Complete ${cropName} analysis: ${cropStage} stage using ${avgETC.toFixed(2)}mm/day (${dailyIrrigationNeeds.toFixed(2)}"/day) vs ${avgETO.toFixed(2)}mm/day atmospheric demand. Kc: ${avgKC.toFixed(2)}, efficiency: ${waterUseEfficiency.toFixed(0)}%. Apply ${weeklyIrrigationNeeds.toFixed(2)}" weekly.`;
      } else if (enabledTypes.etc && enabledTypes.eto && !enabledTypes.kc) {
        summary = `${cropName} water balance: Crop demand ${avgETC.toFixed(2)}mm/day vs atmospheric pull ${avgETO.toFixed(2)}mm/day (${((avgETC/avgETO)*100).toFixed(0)}% ratio). Irrigation strategy: ${weeklyIrrigationNeeds.toFixed(2)}"/week in ${cropStage} stage.`;
      } else if (enabledTypes.etc && !enabledTypes.eto && enabledTypes.kc) {
        summary = `${cropName} water use profile: ETC ${avgETC.toFixed(2)}mm/day with coefficient ${avgKC.toFixed(2)} indicating ${cropStage} stage. Weekly irrigation needs: ${weeklyIrrigationNeeds.toFixed(2)}".`;
      } else if (!enabledTypes.etc && enabledTypes.eto && enabledTypes.kc) {
        summary = `${cropName} environmental demand: ETO ${avgETO.toFixed(2)}mm/day with Kc ${avgKC.toFixed(2)} suggests crop needs ${(avgETO * avgKC).toFixed(2)}mm/day in current ${cropStage} stage.`;
      } else if (enabledTypes.etc && !enabledTypes.eto && !enabledTypes.kc) {
        summary = `${cropName} water consumption focus: Current ETC ${avgETC.toFixed(2)}mm/day (${dailyIrrigationNeeds.toFixed(2)}"/day). Weekly irrigation requirement: ${weeklyIrrigationNeeds.toFixed(2)}".`;
      } else if (!enabledTypes.etc && enabledTypes.eto && !enabledTypes.kc) {
        summary = `Atmospheric demand analysis: ETO ${avgETO.toFixed(2)}mm/day creating environmental pressure on ${cropName}. Weather-driven irrigation adjustments needed.`;
      } else if (!enabledTypes.etc && !enabledTypes.eto && enabledTypes.kc) {
        summary = `${cropName} coefficient analysis: Kc ${avgKC.toFixed(2)} indicates ${cropStage} stage. This coefficient multiplies atmospheric demand to determine actual crop water needs.`;
      } else {
        summary = `Select ETC, ETO, or KC data to view ${cropName} irrigation insights and recommendations.`;
      }
    }
    
    let insights = [];
    let recommendations = [];
    let riskFactors = [];

    // Comprehensive trend-based insights
    if (enabledTypes.etc && etcTrend > 0.1) {
      insights.push(`📈 Rising water demand: ETC increasing ${(etcTrend * 100).toFixed(1)}%/day - crops entering high-demand growth phase`);
      insights.push(`⚡ Peak period approaching: Water needs rising ${(maxETC - avgETC).toFixed(2)}mm above current average`);
    } else if (enabledTypes.etc && etcTrend < -0.1) {
      insights.push(`📉 Declining water demand: ETC dropping ${Math.abs(etcTrend * 100).toFixed(1)}%/day - crops maturing or entering dormancy`);
      insights.push(`💚 Efficiency opportunity: Water needs decreasing ${(avgETC - minETC).toFixed(2)}mm below peak demand`);
    } else if (enabledTypes.etc && Math.abs(etcTrend) <= 0.1) {
      insights.push(`➡️ Stable water demand: ETC holding steady at ${avgETC.toFixed(2)}mm/day - consistent irrigation schedule optimal`);
    }

    if (etoTrend > 0.1) {
      insights.push(`�️ Rising atmospheric demand: ETO increasing ${(etoTrend * 100).toFixed(1)}%/day due to temperature/wind/humidity changes`);
    } else if (etoTrend < -0.1) {
      insights.push(`🌤️ Cooling atmospheric demand: ETO dropping ${Math.abs(etoTrend * 100).toFixed(1)}%/day - favorable irrigation conditions`);
    }

    if (enabledTypes.kc && kcTrend > 0.05) {
      insights.push(`🌱 Crop coefficient rising: Kc trending up ${(kcTrend * 100).toFixed(1)}%/day - plants increasingly active`);
    } else if (enabledTypes.kc && kcTrend < -0.05) {
      insights.push(`🍂 Crop coefficient falling: Kc trending down ${Math.abs(kcTrend * 100).toFixed(1)}%/day - plants reducing activity`);
    }

    // Add guidance for missing data types
    if (!enabledTypes.etc && (enabledTypes.eto || enabledTypes.kc)) {
      insights.push(`💡 Add ETC data to see actual crop water consumption and irrigation timing recommendations`);
    }
    if (!enabledTypes.eto && (enabledTypes.etc || enabledTypes.kc)) {
      insights.push(`💡 Add ETO data to understand atmospheric water demand and weather-based adjustments`);
    }
    if (!enabledTypes.kc && (enabledTypes.etc || enabledTypes.eto)) {
      insights.push(`💡 Add KC data to see crop coefficient trends and growth stage analysis`);
    }

    // Water stress and efficiency analysis
    if (waterStressDays > 0) {
      insights.push(`🚨 Water stress detected: ${waterStressDays} high-demand days (Kc>1.3) during peak atmospheric conditions`);
    }
    
    insights.push(`🎯 Irrigation efficiency: ${efficientDays} days optimal (Kc 0.8-1.2), ${conservationDays} days conservative, ${waterStressDays} days high-demand`);
    
    if (peakDemandDays > 0) {
      insights.push(`⚡ Peak demand periods: ${peakDemandDays} days above ${(avgETC * 1.3).toFixed(2)}mm/day requiring priority irrigation`);
    }

    // Detailed irrigation recommendations based on trends and current conditions
    if (avgETC > avgETO * 1.3) {
      recommendations.push(`🚰 High Priority Irrigation: Apply ${weeklyIrrigationNeeds.toFixed(2)}" weekly in 2-3 deep sessions (0.75-1.0" each)`);
      recommendations.push(`⏰ Optimal timing: Water between 4-8 AM when ETO is lowest, soil absorption highest`);
      recommendations.push(`📊 Monitor daily: Check soil moisture at 6" and 12" depths - maintain 70-80% field capacity`);
      recommendations.push(`🎯 Precision scheduling: Use 1.25x normal irrigation rate during this high-demand period`);
      
      riskFactors.push(`💥 Severe stress risk: Delaying irrigation >24 hours can cause permanent yield loss during this critical period`);
      riskFactors.push(`🌡️ Heat stress amplification: High Kc + rising ETO creates compounding water stress`);
      
    } else if (avgETC < avgETO * 0.7) {
      recommendations.push(`💧 Reduced irrigation: Apply ${weeklyIrrigationNeeds.toFixed(2)}" weekly in 1-2 lighter sessions (0.4-0.6" each)`);
      recommendations.push(`🕐 Extended intervals: Can safely extend to 3-4 day irrigation cycles during this efficient period`);
      recommendations.push(`🔍 Maintenance mode: Focus on consistent moisture rather than saturation - avoid overwatering`);
      recommendations.push(`⚖️ Balance approach: Monitor for sudden weather changes that could spike demand`);
      
      riskFactors.push(`⚠️ Don't under-irrigate: Even efficient crops need consistent moisture for root health`);
      riskFactors.push(`�️ Weather change risk: Sudden heat/wind can rapidly increase water demand`);
      
    } else {
      recommendations.push(`⚖️ Balanced irrigation: Apply ${weeklyIrrigationNeeds.toFixed(2)}" weekly in 2 moderate sessions (0.6-0.8" each)`);
      recommendations.push(`� Standard schedule: Water every 2-3 days based on soil moisture and weather forecast`);
      recommendations.push(`🎯 Fine-tuning: Adjust ±20% based on daily ETO variations and crop response`);
      recommendations.push(`📈 Trend monitoring: Watch for Kc changes indicating growth stage transitions`);
    }

    // Add recommendations for enabling missing data types
    if (activeTypes.length < 3) {
      if (!enabledTypes.etc) {
        recommendations.push(`📊 Enable ETC to get precise irrigation amounts and timing recommendations`);
      }
      if (!enabledTypes.eto) {
        recommendations.push(`🌡️ Enable ETO to incorporate weather conditions into irrigation strategy`);
      }
      if (!enabledTypes.kc) {
        recommendations.push(`🔢 Enable KC to optimize for crop growth stages and efficiency`);
      }
    }

    // Advanced multi-crop insights
    if (actuallyMultiCropETC) {
      const cropNames = Object.keys(cropETCData);
      const cropAnalysis = cropNames.map(crop => ({
        name: crop.replace(/[_-]/g, ' '),
        avgETC: cropETCData[crop].reduce((sum, v) => sum + v, 0) / cropETCData[crop].length,
        maxETC: Math.max(...cropETCData[crop]),
        avgKC: cropKCData[crop] ? cropKCData[crop].reduce((sum, v) => sum + v, 0) / cropKCData[crop].length : null,
        trend: calculateTrend(cropETCData[crop])
      }));

      cropAnalysis.sort((a, b) => b.avgETC - a.avgETC);
      
      insights.push(`🥇 Highest demand: ${cropAnalysis[0].name} at ${cropAnalysis[0].avgETC.toFixed(2)}mm/day (${(cropAnalysis[0].avgETC * 0.0394 * 7).toFixed(2)}"/week)`);
      insights.push(`� Most efficient: ${cropAnalysis[cropAnalysis.length - 1].name} at ${cropAnalysis[cropAnalysis.length - 1].avgETC.toFixed(2)}mm/day`);
      
      const divergentCrops = cropAnalysis.filter(c => Math.abs(c.avgETC - avgETC) > avgETC * 0.3);
      if (divergentCrops.length > 0) {
        insights.push(`⚖️ Variable demands: ${divergentCrops.length} crops need separate irrigation zones for optimal efficiency`);
      }

      recommendations.push(`🎯 Zone-based irrigation: Group crops by water demand - high (>${(avgETC * 1.2).toFixed(2)}mm), medium (${(avgETC * 0.8).toFixed(2)}-${(avgETC * 1.2).toFixed(2)}mm), low (<${(avgETC * 0.8).toFixed(2)}mm)`);
      recommendations.push(`⏱️ Staggered scheduling: Water high-demand crops first (4-6 AM), moderate crops next (6-8 AM), efficient crops last`);
      
      const highTrendCrops = cropAnalysis.filter(c => c.trend > 0.1);
      if (highTrendCrops.length > 0) {
        riskFactors.push(`📈 Rising demand crops: ${highTrendCrops.map(c => c.name).join(', ')} showing increasing water needs - monitor closely`);
      }
    }

    // Add context about current crop selection scope
    if (selectedCrops.length === 1) {
      insights.push(`🎯 Single crop focus: Analysis optimized for ${selectedCrops[0]} - select additional crops above for comparative insights`);
    } else if (selectedCrops.length > 1 && !actuallyMultiCropETC) {
      insights.push(`🌾 Current selection: Analyzing ${selectedCrops.length} crop varieties - use crop checkboxes above to adjust selection`);
    }

    // Seasonal and operational insights
    insights.push(`� Total period demand: ${totalWaterNeeded.toFixed(1)}mm (${(totalWaterNeeded * 0.0394).toFixed(2)}") vs ${totalAtmosphericDemand.toFixed(1)}mm atmospheric`);
    
    if (timeSeriesData.length >= 7) {
      const recentAvg = timeSeriesData.slice(-3).reduce((sum, d) => sum + d.etc, 0) / 3;
      const earlierAvg = timeSeriesData.slice(0, 3).reduce((sum, d) => sum + d.etc, 0) / 3;
      const periodChange = ((recentAvg - earlierAvg) / earlierAvg) * 100;
      
      if (Math.abs(periodChange) > 15) {
        insights.push(`📊 Period trend: Water demand ${periodChange > 0 ? 'increased' : 'decreased'} ${Math.abs(periodChange).toFixed(1)}% over analysis period`);
      }
    }

    // Generate dynamic title based on selected crops and active line types
    let dynamicTitle;
    if (actuallyMultiCropETC) {
      const cropsList = selectedCrops.length > 3 ? `${selectedCrops.slice(0, 3).join(', ')} +${selectedCrops.length - 3} more` : selectedCrops.join(', ');
      dynamicTitle = `${analysisContext} Analysis: ${cropsList} (${analyzedETCCropsCount} crops)`;
    } else {
      const cropName = selectedCrops.length > 0 ? selectedCrops[0] : 'Crop';
      if (activeTypes.length === 3) {
        dynamicTitle = `📊 Complete ${cropName} Water Analysis - ETC vs ETO + KC`;
      } else if (activeTypes.length === 2) {
        dynamicTitle = `📊 ${cropName} ${analysisContext} Comparison Analysis`;
      } else if (activeTypes.length === 1) {
        const singleType = activeTypes[0];
        const typeDescriptions: { [key: string]: string } = {
          'ETC': 'Crop Water Use',
          'ETO': 'Atmospheric Demand', 
          'KC': 'Crop Coefficient'
        };
        dynamicTitle = `📊 ${cropName} ${typeDescriptions[singleType]} (${singleType}) Analysis`;
      } else {
        dynamicTitle = `📊 ${cropName} Water Analysis - No Data Selected`;
      }
    }

    return {
      title: dynamicTitle,
      summary,
      insights,
      recommendations,
      riskFactors,
      confidence: 0.94
    };
  };

  // Helper function to calculate trend
  const calculateTrend = (values: number[]): number => {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const avgY = sumY / n;
    
    return slope / avgY; // Normalize by average to get percentage change per period
  };

  const generateChartInsights = async () => {
    if (!chartData || isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Analyze the actual chart data based on chart type
      const dataAnalysis = analyzeChartData(chartType, chartData);
      setInsights(dataAnalysis);

    } catch (err) {
      console.error('Chart AI insights error:', err);
      setError('Unable to generate insights for this chart');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-regenerate insights when data, crops, or line types change
  useEffect(() => {
    if (isExpanded && chartData) {
      generateChartInsights();
    }
  }, [chartData, cropTypes, chartType, isExpanded, enabledLineTypes]);

  const getDefaultChartInsight = (type: ChartType): ChartInsightData => {
    const insights = {
      precipitation: {
        title: 'Precipitation Analysis',
        summary: "Hey! Let's look at what Mother Nature is bringing to the table with rainfall patterns.",
        insights: [
          "📧 Recent rainfall amounts show the natural irrigation your crops are getting",
          "🌦️ Weather patterns indicate upcoming precipitation that could affect irrigation schedules", 
          "💧 Soil moisture levels from rainfall help determine supplemental water needs"
        ],
        recommendations: [
          "Farmers should adjust irrigation timing based on recent and forecasted rainfall",
          "Consider soil drainage capacity when planning around heavy precipitation events"
        ],
        riskFactors: [
          "Watch for oversaturation if heavy rains combine with existing soil moisture",
          "Monitor for potential water stress if dry periods extend beyond crop tolerance"
        ],
        confidence: 0.85
      },
      evapotranspiration: {
        title: 'ET₀ Analysis',
        summary: "Here's the scoop on how much water the atmosphere is pulling from your soil and crops!",
        insights: [
          "🌡️ Evapotranspiration rates show atmospheric water demand on crops",
          "☀️ Solar radiation and temperature drive daily ET patterns",
          "💨 Wind and humidity affect how quickly crops lose water to the air"
        ],
        recommendations: [
          "Crops benefit most when irrigation matches daily ET₀ rates during peak growing periods",
          "Morning irrigation helps crops prepare for high afternoon ET demands"
        ],
        riskFactors: [
          "High ET₀ periods increase water stress risk if irrigation doesn't keep pace",
          "Sudden ET₀ spikes during hot, windy days can catch crops off guard"
        ],
        confidence: 0.90
      },
      'weather-summary': {
        title: 'Weather Summary',
        summary: "Let's break down the weather conditions and what they mean for farming operations!",
        insights: [
          "🌤️ Current weather conditions create specific opportunities and challenges for crops",
          "📊 Temperature and humidity patterns affect crop growth stages and water needs",
          "🎯 Combined weather factors help predict optimal farming activity windows"
        ],
        recommendations: [
          "Farmers should plan field activities around favorable weather windows",
          "Crop protection measures work best when timed with weather condition changes"
        ],
        riskFactors: [
          "Extreme temperature swings can stress crops beyond their adaptation range",
          "Prolonged unfavorable conditions may require intervention strategies"
        ],
        confidence: 0.80
      },
      'crop-water-use': {
        title: 'Crop Water Use',
        summary: "Time to dive into how much water different crops are actually using!",
        insights: [
          "🌱 Individual crop water consumption varies by growth stage and variety",
          "📈 Water use trends reveal which crops are most efficient with irrigation",
          "⚖️ Comparing crop water needs helps optimize field water distribution"
        ],
        recommendations: [
          "High-efficiency crops should get priority during water shortage periods",
          "Stagger plantings of water-intensive crops to spread peak demand periods"
        ],
        riskFactors: [
          "Water-hungry crops may struggle during drought conditions without priority irrigation",
          "Uneven water distribution between crops can create yield inconsistencies"
        ],
        confidence: 0.88
      },
      'etc-comparison': {
        title: 'ETC vs ETO Comparison',
        summary: "Let's see how crop water needs stack up against what the atmosphere demands!",
        insights: [
          "📊 ETC shows actual crop water needs while ETO represents atmospheric demand",
          "🎯 The gap between ETC and ETO reveals crop coefficient efficiency",
          "⚡ Timing differences help identify when crops need the most irrigation support"
        ],
        recommendations: [
          "Irrigation schedules should closely match ETC peaks rather than just ETO patterns",
          "Crops with consistently high ETC/ETO ratios may benefit from variety selection review"
        ],
        riskFactors: [
          "When ETC exceeds ETO significantly, crops face higher stress during water shortages",
          "Large ETC-ETO gaps during critical growth stages require careful water management"
        ],
        confidence: 0.92
      }
    };

    return insights[type] || insights['weather-summary'];
  };

  const handleToggle = () => {
    if (!isExpanded && !insights && !isLoading) {
      generateChartInsights();
    }
    setIsExpanded(!isExpanded);
  };

  // Always render the inline expansion now - similar to AI Crop Insights
  if (compact && !isExpanded) {
    return (
      <div className={`flex justify-center my-4 ${className}`}>
        <button
          onClick={handleToggle}
          className="flex items-center gap-3 px-6 py-3 text-base rounded-xl border-3 border-blue-300 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 animate-pulse hover:animate-none"
          style={{
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3), 0 0 20px rgba(16, 185, 129, 0.4)',
            border: '3px solid #3B82F6'
          }}
        >
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-white animate-bounce" />
            <span className="font-bold text-lg text-white">GET AI INSIGHTS</span>
            <span className="text-sm bg-orange-500 text-white px-2 py-1 rounded-full font-bold animate-pulse">NEW!</span>
          </div>
          <ChevronDown className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className={`border border-gray-600 dark:border-gray-500 rounded-lg bg-gray-800 dark:bg-gray-900 shadow-lg ${className}`} style={{ backgroundColor: '#1e293b', color: '#e2e8f0' }}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer border-b border-gray-600 dark:border-gray-600 bg-gradient-to-r from-blue-800/30 to-emerald-800/30 dark:from-gray-800 dark:to-gray-750 rounded-t-lg"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          <IconComponent className={`h-5 w-5 ${config.color}`} />
          <div>
            <h4 className="text-sm font-bold text-white dark:text-white">
              📊 {config.title} - Real Data Analysis
            </h4>
            <p className="text-xs text-gray-300 dark:text-gray-300 font-medium">
              What this data means for your irrigation decisions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {insights?.confidence && (
            <span className="text-xs text-gray-300 bg-gray-600 px-3 py-1 rounded-full shadow-sm font-medium">
              {Math.round(insights.confidence * 100)}% accuracy
            </span>
          )}
          <ChevronUp className="h-5 w-5 text-gray-300" />
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4" style={{ backgroundColor: '#334155' }}>
          {isLoading && (
            <div className="flex items-center gap-3 text-blue-400 py-6 justify-center">
              <Brain className="h-5 w-5 animate-pulse" />
              <span className="text-sm font-medium">Analyzing real chart data...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-400 py-3 px-4 bg-red-900/30 rounded-lg border border-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {insights && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-700 rounded-xl p-4 border-l-4 border-blue-500 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-lg">📊</span>
                  <h6 className="text-sm font-bold text-blue-200">Data Summary</h6>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed font-medium text-center">
                  {insights.summary}
                </p>
              </div>

              {/* Key Insights */}
              <div className="bg-gray-700 rounded-xl p-4 shadow-sm">
                <h5 className="text-sm font-bold text-white mb-3 flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  What This Data Tells Us
                </h5>
                <div className="space-y-3">
                  {insights.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-600 rounded-lg">
                      <span className="text-emerald-400 mt-1 text-sm font-bold">●</span>
                      <span className="text-sm text-gray-200 leading-relaxed font-medium">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations & Risk Factors */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-700 rounded-xl p-4 border-l-4 border-emerald-500 shadow-sm">
                  <h5 className="text-sm font-bold text-white mb-3 flex items-center justify-center gap-2">
                    <Target className="h-4 w-4 text-emerald-400" />
                    Irrigation Actions Based on This Data
                  </h5>
                  <div className="space-y-2">
                    {insights.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-emerald-800/30 rounded-lg border border-emerald-700">
                        <span className="text-emerald-400 mt-1 text-sm font-bold">→</span>
                        <span className="text-sm text-gray-200 leading-relaxed font-medium">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {insights.riskFactors.length > 0 && (
                  <div className="bg-gray-700 rounded-xl p-4 border-l-4 border-orange-500 shadow-sm">
                    <h5 className="text-sm font-bold text-white mb-3 flex items-center justify-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                      Watch Out For
                    </h5>
                    <div className="space-y-2">
                      {insights.riskFactors.map((risk, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-orange-800/30 rounded-lg border border-orange-700">
                          <span className="text-orange-400 mt-1 text-sm font-bold">⚠</span>
                          <span className="text-sm text-gray-200 leading-relaxed font-medium">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-xs text-gray-300 pt-3 border-t border-gray-600 text-center bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    📊 <strong>{chartData?.length || 0}</strong> data points analyzed
                  </span>
                  <span className="flex items-center gap-1">
                    🎯 <strong>{Math.round(insights.confidence * 100)}%</strong> accuracy
                  </span>
                  <span className="flex items-center gap-1">
                    <strong>AI-powered</strong> agricultural insights
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChartAIInsights;