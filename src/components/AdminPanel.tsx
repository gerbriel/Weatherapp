import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  Trash2, 
  RotateCcw, 
  Users, 
  Mail, 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Shield,
  Send,
  Eye,
  EyeOff,
  Edit3,
  Save,
  RotateCcw as Undo,
  History
} from 'lucide-react';
import { EmailSubscriptionService } from '../services/supabaseService';
import { resendService } from '../services/resendService';
import { supabase } from '../lib/supabase';
import type { 
  EmailSubscription, 
  EmailStats, 
  EnhancedEmailSendLog,
  SubscriberProfile,
  SubscriberStats
} from '../types/weather';
import type { ResendStats } from '../services/resendService';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [subscriptions, setSubscriptions] = useState<EmailSubscription[]>([]);
  const [supabaseStats, setSupabaseStats] = useState<EmailStats | null>(null);
  const [resendStats, setResendStats] = useState<ResendStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<EnhancedEmailSendLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'subscribers' | 'activity' | 'resend' | 'coefficients'>('overview');
  const [coefficientsSubTab, setCoefficientSubTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [subscriberProfiles, setSubscriberProfiles] = useState<SubscriberProfile[]>([]);
  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats | null>(null);
  const [selectedSubscriber, setSelectedSubscriber] = useState<SubscriberProfile | null>(null);
  const [pendingCoefficients, setPendingCoefficients] = useState<any[]>([]);
  const [approvedCoefficients, setApprovedCoefficients] = useState<any[]>([]);
  const [rejectedCoefficients, setRejectedCoefficients] = useState<any[]>([]);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedCoefficientForAudit, setSelectedCoefficientForAudit] = useState<any>(null);
  
  // Simple admin password - in production, use proper authentication
  const ADMIN_PASSWORD = 'weather-admin-2025';

  // Enhanced CoefficientCard component with editing capabilities
  const CoefficientCard = ({ coefficient, status, onApprove, onReject, onDelete, onEdit, onRevertToPending, onShowHistory }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
      kc_initial: coefficient.kc_initial,
      kc_development: coefficient.kc_development,
      kc_mid: coefficient.kc_mid,
      kc_late: coefficient.kc_late,
      initial_stage_days: coefficient.initial_stage_days,
      development_stage_days: coefficient.development_stage_days,
      mid_stage_days: coefficient.mid_stage_days,
      late_stage_days: coefficient.late_stage_days,
      source: coefficient.source || '',
      notes: coefficient.notes || ''
    });

    const getStatusBadge = () => {
      switch (status) {
        case 'pending':
          return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Pending Review</span>;
        case 'approved':
          return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Approved</span>;
        case 'rejected':
          return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Rejected</span>;
        default:
          return null;
      }
    };

    const handleSaveEdit = async () => {
      if (onEdit) {
        await onEdit(coefficient.id, editData);
        setIsEditing(false);
      }
    };

    const handleCancelEdit = () => {
      setEditData({
        kc_initial: coefficient.kc_initial,
        kc_development: coefficient.kc_development,
        kc_mid: coefficient.kc_mid,
        kc_late: coefficient.kc_late,
        initial_stage_days: coefficient.initial_stage_days,
        development_stage_days: coefficient.development_stage_days,
        mid_stage_days: coefficient.mid_stage_days,
        late_stage_days: coefficient.late_stage_days,
        source: coefficient.source || '',
        notes: coefficient.notes || ''
      });
      setIsEditing(false);
    };

    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {coefficient.crop_varieties?.crop_categories?.name || 'Category'} - {coefficient.crop_varieties?.name || coefficient.crop_varieties?.common_name || `Variety ID: ${coefficient.crop_variety_id}`}
              </h4>
              {getStatusBadge()}
              {isEditing && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  <Edit3 className="w-3 h-3 mr-1" />
                  Editing
                </span>
              )}
            </div>
            
            {/* Kc Values */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Kc Initial:</span>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editData.kc_initial}
                    onChange={(e) => setEditData({...editData, kc_initial: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="font-medium">{coefficient.kc_initial}</p>
                )}
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Kc Development:</span>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editData.kc_development}
                    onChange={(e) => setEditData({...editData, kc_development: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="font-medium">{coefficient.kc_development}</p>
                )}
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Kc Mid:</span>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editData.kc_mid}
                    onChange={(e) => setEditData({...editData, kc_mid: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="font-medium">{coefficient.kc_mid}</p>
                )}
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Kc Late:</span>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editData.kc_late}
                    onChange={(e) => setEditData({...editData, kc_late: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="font-medium">{coefficient.kc_late}</p>
                )}
              </div>
            </div>
            
            {/* Days Values */}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Initial Days:</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.initial_stage_days}
                    onChange={(e) => setEditData({...editData, initial_stage_days: parseInt(e.target.value) || 0})}
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="font-medium">{coefficient.initial_stage_days}</p>
                )}
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Development Days:</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.development_stage_days}
                    onChange={(e) => setEditData({...editData, development_stage_days: parseInt(e.target.value) || 0})}
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="font-medium">{coefficient.development_stage_days}</p>
                )}
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Mid Days:</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.mid_stage_days}
                    onChange={(e) => setEditData({...editData, mid_stage_days: parseInt(e.target.value) || 0})}
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="font-medium">{coefficient.mid_stage_days}</p>
                )}
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Late Days:</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.late_stage_days}
                    onChange={(e) => setEditData({...editData, late_stage_days: parseInt(e.target.value) || 0})}
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                ) : (
                  <p className="font-medium">{coefficient.late_stage_days}</p>
                )}
              </div>
            </div>
            
            {/* Source and Notes */}
            <div className="mt-3 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Source:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.source}
                  onChange={(e) => setEditData({...editData, source: e.target.value})}
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Source of data"
                />
              ) : (
                <p className="font-medium">{coefficient.source || 'User Submitted'}</p>
              )}
            </div>

            {isEditing && (
              <div className="mt-3 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Notes:</span>
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({...editData, notes: e.target.value})}
                  className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {status === 'pending' ? 'Submitted' : status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(coefficient.created_at).toLocaleString()}
              {coefficient.updated_at && coefficient.updated_at !== coefficient.created_at && (
                <span className="ml-2">• Updated: {new Date(coefficient.updated_at).toLocaleString()}</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            {/* Pending actions */}
            {status === 'pending' && onApprove && onReject && (
              <>
                <button
                  onClick={() => onApprove(coefficient.id)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => onReject(coefficient.id)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            
            {/* Approved/Rejected actions */}
            {(status === 'approved' || status === 'rejected') && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    {onShowHistory && (
                      <button
                        onClick={() => onShowHistory(coefficient)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        Crop History
                      </button>
                    )}
                    {onRevertToPending && (
                      <button
                        onClick={() => onRevertToPending(coefficient.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
                      >
                        <Undo className="w-4 h-4" />
                        Revert
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(coefficient.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError(null);
      loadAllData();
    } else {
      setError('Invalid admin password');
    }
  };

  // Helper function to enrich coefficient data with variety information
  const enrichCoefficientData = async (data: any[]) => {
    if (!data || data.length === 0) return data;
    
    try {
      const varietyIds = data.map(p => p.crop_variety_id);
      const { data: varieties } = await supabase
        .from('crop_varieties')
        .select('id, common_name, crop_categories(category_name)')
        .in('id', varietyIds);
      
      // Merge variety information
      return data.map(pending => {
        const variety = varieties?.find(v => v.id === pending.crop_variety_id);
        return {
          ...pending,
          crop_varieties: variety
        };
      });
    } catch (varietyError) {
      console.warn('Could not load variety names:', varietyError);
      return data;
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [subsData, statsData, activityData, subscriberProfilesData, subscriberStatsData, pendingCoeffsData, approvedCoeffsData, rejectedCoeffsData] = await Promise.all([
        EmailSubscriptionService.getAllSubscriptions(),
        EmailSubscriptionService.getEmailStats(),
        EmailSubscriptionService.getRecentActivity(50),
        EmailSubscriptionService.getSubscriberProfiles(),
        EmailSubscriptionService.getSubscriberStats(),
        // Load pending crop coefficients for admin review (only pending status)
        supabase
          .from('pending_crop_coefficients')
          .select('*')
          .eq('status', 'pending')  // Only show pending coefficients
          .order('created_at', { ascending: false })
          .then(async ({ data, error }) => {
            if (error) {
              console.warn('Error loading pending coefficients:', error);
              return [];
            }
            return await enrichCoefficientData(data || []);
          }),
        // Load approved coefficients
        supabase
          .from('pending_crop_coefficients')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .then(async ({ data, error }) => {
            if (error) {
              console.warn('Error loading approved coefficients:', error);
              return [];
            }
            return await enrichCoefficientData(data || []);
          }),
        // Load rejected coefficients
        supabase
          .from('pending_crop_coefficients')
          .select('*')
          .eq('status', 'rejected')
          .order('created_at', { ascending: false })
          .then(async ({ data, error }) => {
            if (error) {
              console.warn('Error loading rejected coefficients:', error);
              return [];
            }
            return await enrichCoefficientData(data || []);
          })
      ]);

      setSubscriptions(subsData);
      setSupabaseStats(statsData);
      setRecentActivity(activityData);
      setSubscriberProfiles(subscriberProfilesData);
      setSubscriberStats(subscriberStatsData);
      
      console.log('Setting coefficient arrays:');
      console.log('- Pending:', pendingCoeffsData.length, 'items');
      console.log('- Approved:', approvedCoeffsData.length, 'items');
      console.log('- Rejected:', rejectedCoeffsData.length, 'items');
      
      setPendingCoefficients(pendingCoeffsData);
      setApprovedCoefficients(approvedCoeffsData);
      setRejectedCoefficients(rejectedCoeffsData);
      
      console.log('Loaded pending coefficients:', pendingCoeffsData.length, 'items');
      console.log('Pending coefficient IDs:', pendingCoeffsData.map(p => p.id));
      console.log('Loaded approved coefficients:', approvedCoeffsData.length, 'items');
      console.log('Loaded rejected coefficients:', rejectedCoeffsData.length, 'items');

      // Load Resend stats if configured
      if (resendService.isConfigured()) {
        const resendData = await resendService.getEmailStats();
        setResendStats(resendData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await EmailSubscriptionService.deleteSubscription(id);
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubscription = async (id: string, enabled: boolean) => {
    try {
      setLoading(true);
      await EmailSubscriptionService.updateSubscription(id, { enabled });
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleResetNextSend = async (id: string) => {
    if (!confirm('Reset this subscription to send immediately?')) {
      return;
    }
    
    try {
      setLoading(true);
      await EmailSubscriptionService.resetSubscription(id);
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset send time');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePendingCoefficient = async (id: string) => {
    console.log('� UPDATED APPROVE CODE WITH DELAY AND DEBUG');
    console.log('�🚀 Approving coefficient with ID:', id);
    
    try {
      setLoading(true);

      // Get the pending coefficient data
      const { data: pendingData, error: fetchError } = await supabase
        .from('pending_crop_coefficients')
        .select(`
          *,
          crop_varieties (
            id,
            common_name,
            scientific_name,
            crop_categories (
              category_name
            )
          )
        `)
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching pending data:', fetchError);
        throw new Error('Could not fetch pending data');
      }
      
      console.log('Pending data:', pendingData);

      // Check for existing coefficients for this variety before approval
      const { data: existingCoefficients, error: existingError } = await supabase
        .from('crop_coefficients')
        .select(`
          *,
          growth_stages (
            stage_name
          )
        `)
        .eq('variety_id', pendingData.crop_variety_id);
        
      if (existingError) {
        console.warn('Could not check existing coefficients:', existingError);
      }

      // Enhanced confirmation dialog showing what will be overwritten
      let confirmMessage = `🔄 APPROVE COEFFICIENT SUBMISSION\n\n`;
      confirmMessage += `Crop: ${pendingData.crop_varieties?.crop_categories?.category_name || 'Unknown'} - ${pendingData.crop_varieties?.common_name || pendingData.crop_varieties?.scientific_name || 'Unknown Variety'}\n\n`;
      
      confirmMessage += `NEW VALUES TO BE APPLIED:\n`;
      confirmMessage += `• Kc Initial: ${pendingData.kc_initial} (${pendingData.initial_stage_days} days)\n`;
      confirmMessage += `• Kc Development: ${pendingData.kc_development} (${pendingData.development_stage_days} days)\n`;
      confirmMessage += `• Kc Mid-Season: ${pendingData.kc_mid} (${pendingData.mid_stage_days} days)\n`;
      confirmMessage += `• Kc Late Season: ${pendingData.kc_late} (${pendingData.late_stage_days} days)\n`;
      
      if (existingCoefficients && existingCoefficients.length > 0) {
        confirmMessage += `\n⚠️ EXISTING DATA WILL BE REPLACED:\n`;
        existingCoefficients.forEach(coeff => {
          confirmMessage += `• ${coeff.growth_stages?.stage_name || 'Unknown Stage'}: Kc=${coeff.kc_value}, Days=${coeff.stage_duration_days}\n`;
        });
        confirmMessage += `\n❌ ${existingCoefficients.length} existing coefficient record(s) will be DELETED and replaced.\n`;
      } else {
        confirmMessage += `\n✅ No existing coefficients found - this will create new records.\n`;
      }
      
      confirmMessage += `\nSource: ${pendingData.source || 'User Submission'}`;
      if (pendingData.submitted_by_name) {
        confirmMessage += `\nSubmitted by: ${pendingData.submitted_by_name}`;
      }
      if (pendingData.notes) {
        confirmMessage += `\nNotes: ${pendingData.notes}`;
      }
      
      confirmMessage += `\n\n⚡ This action will make these coefficients LIVE in the application immediately.`;
      confirmMessage += `\n\nContinue with approval?`;

      if (!confirm(confirmMessage)) {
        setLoading(false);
        return;
      }

      // Get the growth stage IDs from the database
      const { data: growthStages, error: stagesError } = await supabase
        .from('growth_stages')
        .select('id, stage_name')
        .order('stage_order');

      if (stagesError) {
        console.error('Error fetching growth stages:', stagesError);
        throw new Error('Could not fetch growth stages');
      }

      // Create a lookup map for stage names to IDs
      const stageIdMap = growthStages.reduce((map, stage) => {
        map[stage.stage_name.toLowerCase()] = stage.id;
        return map;
      }, {} as Record<string, string>);

      // Map FAO-56 stages to growth stage IDs using actual UUIDs
      const stageMap = {
        'initial': { 
          id: stageIdMap['initial'], 
          kc: pendingData.kc_initial, 
          days: pendingData.initial_stage_days 
        },
        'development': { 
          id: stageIdMap['development'], 
          kc: pendingData.kc_development, 
          days: pendingData.development_stage_days 
        },
        'mid': { 
          id: stageIdMap['mid-season'], 
          kc: pendingData.kc_mid, 
          days: pendingData.mid_stage_days 
        },
        'late': { 
          id: stageIdMap['late season'], 
          kc: pendingData.kc_late, 
          days: pendingData.late_stage_days 
        }
      };

      // Insert individual coefficient records
      const coefficientsToInsert = Object.entries(stageMap)
        .filter(([_, stage]) => stage.kc !== null && stage.kc !== undefined && stage.id)
        .map(([_, stage]) => ({
          variety_id: pendingData.crop_variety_id,
          growth_stage_id: stage.id,
          kc_value: stage.kc,
          stage_duration_days: stage.days,
          source: pendingData.source || 'Admin Approved',
          notes: pendingData.notes || null
        }));

      console.log('Coefficients to insert:', coefficientsToInsert);

      if (coefficientsToInsert.length > 0) {
        // First, delete any existing coefficients for this variety
        const { error: deleteError } = await supabase
          .from('crop_coefficients')
          .delete()
          .eq('variety_id', pendingData.crop_variety_id);
        
        if (deleteError) {
          console.warn('Could not delete existing coefficients:', deleteError);
        } else {
          console.log('Deleted existing coefficients for variety');
        }
        
        // Then insert the new coefficients
        const { error: insertError } = await supabase
          .from('crop_coefficients')
          .insert(coefficientsToInsert);
          
        if (insertError) {
          console.error('Error inserting coefficients:', insertError);
          throw insertError;
        }
        
        console.log('Successfully inserted coefficients');
      }
      
      // Mark the pending coefficient as approved instead of deleting
      const { error: updateError } = await supabase
        .from('pending_crop_coefficients')
        .update({ status: 'approved' })
        .eq('id', id);
        
      if (updateError) {
        console.error('Error updating coefficient status:', updateError);
        throw updateError;
      }
      
      console.log('Successfully approved and marked coefficient as approved');
      console.log('Reloading data...');
      
      // Clear existing state to force re-render
      setPendingCoefficients([]);
      setApprovedCoefficients([]);
      setRejectedCoefficients([]);
      
      // Small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadAllData();
      console.log('Data reloaded, pending coefficients count:', pendingCoefficients.length);
    } catch (err) {
      console.error('Error in approve function:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve coefficient');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPendingCoefficient = async (id: string) => {
    if (!confirm('Are you sure you want to reject this pending coefficient?')) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('Rejecting pending coefficient with ID:', id);
      
      // Mark the pending coefficient as rejected instead of deleting
      const { error } = await supabase
        .from('pending_crop_coefficients')
        .update({ status: 'rejected' })
        .eq('id', id);
        
      if (error) {
        console.error('Error updating coefficient status:', error);
        throw error;
      }
      
      console.log('Successfully rejected coefficient');
      console.log('Reloading data...');
      
      // Clear existing state to force re-render
      setPendingCoefficients([]);
      setApprovedCoefficients([]);
      setRejectedCoefficients([]);
      
      // Small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadAllData();
      console.log('Data reloaded, pending coefficients count:', pendingCoefficients.length);
    } catch (err) {
      console.error('Failed to reject coefficient:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject coefficient');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProcessedCoefficient = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this processed coefficient? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('Permanently deleting coefficient with ID:', id);
      
      const { error } = await supabase
        .from('pending_crop_coefficients')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting coefficient:', error);
        throw error;
      }
      
      console.log('Successfully deleted coefficient');
      console.log('Reloading data...');
      
      // Clear existing state to force re-render
      setPendingCoefficients([]);
      setApprovedCoefficients([]);
      setRejectedCoefficients([]);
      
      await loadAllData();
      console.log('Data reloaded');
    } catch (err) {
      console.error('Failed to delete coefficient:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete coefficient');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCoefficient = async (id: string, editData: any) => {
    try {
      setLoading(true);
      console.log('Editing coefficient with ID:', id, editData);
      
      // First, get the coefficient data to check its status and variety
      const { data: coefficientData, error: fetchError } = await supabase
        .from('pending_crop_coefficients')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching coefficient:', fetchError);
        throw fetchError;
      }
      
      // Update the pending_crop_coefficients record
      const { error: updateError } = await supabase
        .from('pending_crop_coefficients')
        .update({
          kc_initial: editData.kc_initial,
          kc_development: editData.kc_development,
          kc_mid: editData.kc_mid,
          kc_late: editData.kc_late,
          initial_stage_days: editData.initial_stage_days,
          development_stage_days: editData.development_stage_days,
          mid_stage_days: editData.mid_stage_days,
          late_stage_days: editData.late_stage_days,
          source: editData.source,
          notes: editData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (updateError) {
        console.error('Error updating coefficient:', updateError);
        throw updateError;
      }
      
      // If this is an approved coefficient, also update the live crop_coefficients table
      if (coefficientData.status === 'approved') {
        console.log('Updating live crop_coefficients table for approved coefficient');
        
        // Get the growth stage IDs
        const { data: growthStages, error: stagesError } = await supabase
          .from('growth_stages')
          .select('id, stage_name')
          .order('stage_order');

        if (stagesError) {
          console.error('Error fetching growth stages:', stagesError);
          throw stagesError;
        }

        const stageIdMap = growthStages.reduce((map, stage) => {
          map[stage.stage_name.toLowerCase()] = stage.id;
          return map;
        }, {} as Record<string, string>);

        // Delete existing live coefficients for this variety
        const { error: deleteError } = await supabase
          .from('crop_coefficients')
          .delete()
          .eq('variety_id', coefficientData.crop_variety_id);
        
        if (deleteError) {
          console.warn('Could not delete existing live coefficients:', deleteError);
        }

        // Insert updated live coefficients
        const stageMap = {
          'initial': { id: stageIdMap['initial'], kc: editData.kc_initial, days: editData.initial_stage_days },
          'development': { id: stageIdMap['development'], kc: editData.kc_development, days: editData.development_stage_days },
          'mid': { id: stageIdMap['mid-season'], kc: editData.kc_mid, days: editData.mid_stage_days },
          'late': { id: stageIdMap['late season'], kc: editData.kc_late, days: editData.late_stage_days }
        };

        const coefficientsToInsert = Object.entries(stageMap)
          .filter(([_, stage]) => stage.kc !== null && stage.kc !== undefined && stage.id)
          .map(([_, stage]) => ({
            variety_id: coefficientData.crop_variety_id,
            growth_stage_id: stage.id,
            kc_value: stage.kc,
            stage_duration_days: stage.days,
            source: editData.source || 'Admin Edited',
            notes: editData.notes || null
          }));

        if (coefficientsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('crop_coefficients')
            .insert(coefficientsToInsert);
            
          if (insertError) {
            console.error('Error inserting updated live coefficients:', insertError);
            throw insertError;
          }
          
          console.log('Successfully updated live coefficients');
        }
      }
      
      console.log('Successfully updated coefficient');
      
      // Clear existing state to force re-render
      setPendingCoefficients([]);
      setApprovedCoefficients([]);
      setRejectedCoefficients([]);
      
      await loadAllData();
      console.log('Data reloaded after edit');
    } catch (err) {
      console.error('Failed to edit coefficient:', err);
      setError(err instanceof Error ? err.message : 'Failed to update coefficient');
    } finally {
      setLoading(false);
    }
  };

  const handleRevertToPending = async (id: string) => {
    if (!confirm('Revert this coefficient back to pending status for re-review?')) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('Reverting coefficient to pending with ID:', id);
      
      const { error } = await supabase
        .from('pending_crop_coefficients')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
        
      if (error) {
        console.error('Error reverting coefficient status:', error);
        throw error;
      }
      
      console.log('Successfully reverted coefficient to pending');
      
      // Clear existing state to force re-render
      setPendingCoefficients([]);
      setApprovedCoefficients([]);
      setRejectedCoefficients([]);
      
      await loadAllData();
      console.log('Data reloaded after revert');
    } catch (err) {
      console.error('Failed to revert coefficient:', err);
      setError(err instanceof Error ? err.message : 'Failed to revert coefficient to pending');
    } finally {
      setLoading(false);
    }
  };

  const handleShowAuditHistory = async (coefficient: any) => {
    try {
      setLoading(true);
      console.log('Loading audit history for crop variety:', coefficient.crop_variety_id);
      
      // Get all coefficients for this crop variety (not just this specific record)
      const { data: allCropCoefficients, error: cropError } = await supabase
        .from('pending_crop_coefficients')
        .select('id')
        .eq('crop_variety_id', coefficient.crop_variety_id);
        
      if (cropError) {
        console.error('Error loading crop coefficients:', cropError);
        throw cropError;
      }
      
      const coefficientIds = allCropCoefficients?.map(c => c.id) || [];
      console.log('Found coefficient IDs for this crop:', coefficientIds);
      
      if (coefficientIds.length === 0) {
        setAuditHistory([]);
        setSelectedCoefficientForAudit(coefficient);
        setShowAuditModal(true);
        return;
      }
      
      // Get audit history for ALL coefficients of this crop variety
      const { data: auditData, error } = await supabase
        .from('coefficient_audit_log')
        .select(`
          *,
          pending_crop_coefficients!coefficient_id (
            id,
            submitted_by_name,
            submitted_by_email,
            source,
            notes,
            status,
            created_at
          )
        `)
        .in('coefficient_id', coefficientIds)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error loading audit history:', error);
        throw error;
      }
      
      setAuditHistory(auditData || []);
      setSelectedCoefficientForAudit(coefficient);
      setShowAuditModal(true);
      console.log('Loaded crop audit history:', auditData?.length || 0, 'entries for', coefficientIds.length, 'coefficient submissions');
    } catch (err) {
      console.error('Failed to load audit history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit history');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscriber = async (email: string) => {
    const subscriber = subscriberProfiles.find(p => p.email === email);
    if (!subscriber) return;

    const confirmMessage = `⚠️ DANGER: Delete subscriber "${subscriber.name}" (${email})?\n\nThis will permanently remove:\n• ${subscriber.totalSubscriptions} subscription(s)\n• ${subscriber.totalEmailsSent} email log(s)\n• All associated data\n\nThis action CANNOT be undone!`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      setLoading(true);
      await EmailSubscriptionService.deleteSubscriber(email);
      await loadAllData();
      setSelectedSubscriber(null); // Close details if this subscriber was selected
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscriber');
    } finally {
      setLoading(false);
    }
  };

  const getScheduleDisplay = (subscription: EmailSubscription) => {
    const daysOfWeek = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    if (subscription.is_recurring) {
      const dayName = daysOfWeek[subscription.schedule_day_of_week || 1];
      const time = `${subscription.schedule_hour?.toString().padStart(2, '0')}:${subscription.schedule_minute?.toString().padStart(2, '0')}`;
      return `Every ${dayName} at ${time} (${subscription.schedule_timezone})`;
    } else {
      return subscription.scheduled_at ? 
        `Once on ${new Date(subscription.scheduled_at).toLocaleDateString()} at ${new Date(subscription.scheduled_at).toLocaleTimeString()}` :
        'Not scheduled';
    }
  };

  const getNextSendDisplay = (subscription: EmailSubscription) => {
    if (!subscription.next_send_at) return 'Not scheduled';
    
    const nextSend = new Date(subscription.next_send_at);
    const now = new Date();
    const diff = nextSend.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `In ${days}d ${hours}h`;
    if (hours > 0) return `In ${hours}h ${minutes}m`;
    return `In ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered': return 'text-green-600 dark:text-green-400';
      case 'failed':
      case 'bounced': return 'text-red-600 dark:text-red-400';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'failed':
      case 'bounced': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Admin Access Required
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter admin password to manage subscriptions
                </p>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="gh-input w-full pr-10"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="gh-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleLogin}
                className="gh-btn gh-btn-primary"
                disabled={!password}
              >
                Access Admin Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full mx-4 my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Admin Dashboard - Email Analytics
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Comprehensive email system management and analytics
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={loadAllData}
                className="gh-btn"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={onClose}
                className="gh-btn gh-btn-primary"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'subscriptions', label: 'Subscriptions', icon: Users },
              { id: 'subscribers', label: 'Subscribers', icon: Users },
              { id: 'activity', label: 'Activity', icon: Activity },
              { id: 'coefficients', label: 'Coefficients', icon: Shield },
              { id: 'resend', label: 'Resend Stats', icon: Mail }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          {/* Content Area */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading analytics...</span>
              </div>
            )}

            {!loading && activeTab === 'overview' && supabaseStats && (
              <div className="space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">Total Subscribers</h3>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{supabaseStats.totalSubscriptions}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{supabaseStats.activeSubscriptions} active</p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h3 className="font-medium text-green-900 dark:text-green-100">Emails Sent</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{supabaseStats.totalEmailsSent}</p>
                    <p className="text-sm text-green-700 dark:text-green-300">{supabaseStats.successfulSends} successful</p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-medium text-purple-900 dark:text-purple-100">Recurring Subs</h3>
                    </div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{subscriberStats?.activeRecurringSubscriptions || 0}</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">{subscriberStats?.recurringSubscribers || 0} users</p>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <h3 className="font-medium text-orange-900 dark:text-orange-100">Single Sends</h3>
                    </div>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{subscriberStats?.totalSingleSends || 0}</p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      {subscriberStats?.completedSingleSends || 0} sent, {subscriberStats?.pendingSingleSends || 0} pending
                    </p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Email Activity</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {supabaseStats.recentSends.slice(0, 10).map(log => (
                      <div key={log.id} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                          <div className={getStatusColor(log.status)}>
                            {getStatusIcon(log.status)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {log.subscription?.email || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(log.sent_at).toLocaleString()} • {log.locations_count || 0} locations
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!loading && activeTab === 'subscriptions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    All Subscriptions ({subscriptions.length})
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Schedule</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Next Send</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {subscriptions.map(sub => (
                        <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{sub.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{sub.name}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sub.is_recurring 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                            }`}>
                              {sub.is_recurring ? 'Recurring' : 'One-time'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {getScheduleDisplay(sub)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              sub.enabled 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            }`}>
                              {sub.enabled ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {sub.next_send_at ? (
                              <span className={
                                new Date(sub.next_send_at) < new Date() 
                                  ? 'text-red-600 dark:text-red-400 font-medium' 
                                  : 'text-gray-600 dark:text-gray-400'
                              }>
                                {getNextSendDisplay(sub)}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not scheduled</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleResetNextSend(sub.id)}
                                className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                title="Reset to send now"
                                disabled={loading}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleSubscription(sub.id, !sub.enabled)}
                                className={`p-1 ${sub.enabled 
                                  ? 'text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300' 
                                  : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                                }`}
                                title={sub.enabled ? 'Disable subscription' : 'Enable subscription'}
                                disabled={loading}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubscription(sub.id)}
                                className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                title="Delete subscription"
                                disabled={loading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loading && activeTab === 'subscribers' && (
              <div className="space-y-6">
                {/* Subscriber Overview Stats */}
                {subscriberStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">Total Subscribers</h3>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{subscriberStats.totalSubscribers}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{subscriberStats.activeSubscribers} active</p>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <h3 className="font-medium text-green-900 dark:text-green-100">Avg Subscriptions</h3>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {subscriberStats.avgSubscriptionsPerUser.toFixed(1)}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">per subscriber</p>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h3 className="font-medium text-purple-900 dark:text-purple-100">API Requests</h3>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{subscriberStats.totalApiRequests}</p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">total requests</p>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <h3 className="font-medium text-orange-900 dark:text-orange-100">Top Location</h3>
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {subscriberStats.topLocations[0]?.locationName || 'N/A'}
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        {subscriberStats.topLocations[0]?.subscriberCount || 0} users
                      </p>
                    </div>
                  </div>
                )}

                {/* Recurring vs Single Sends Breakdown */}
                {subscriberStats && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Subscription Types Breakdown
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Recurring Subscriptions */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2 mb-3">
                          <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <h4 className="font-medium text-gray-900 dark:text-white">Recurring Subscriptions</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Total Users:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{subscriberStats.recurringSubscribers}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Active Subscriptions:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">{subscriberStats.activeRecurringSubscriptions}</span>
                          </div>
                        </div>
                      </div>

                      {/* Single Sends */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2 mb-3">
                          <Send className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                          <h4 className="font-medium text-gray-900 dark:text-white">Single Sends</h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Total Users:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{subscriberStats.singleSendUsers}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Total Sends:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{subscriberStats.totalSingleSends}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Completed:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">{subscriberStats.completedSingleSends}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Pending:</span>
                            <span className="font-medium text-orange-600 dark:text-orange-400">{subscriberStats.pendingSingleSends}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscriber Profiles List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Subscriber Profiles ({subscriberProfiles.length})
                    </h3>
                  </div>
                  
                  <div className="grid gap-4">
                    {subscriberProfiles.map(subscriber => (
                      <div key={subscriber.email} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{subscriber.name}</h4>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{subscriber.email}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                subscriber.activeSubscriptions > 0
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              }`}>
                                {subscriber.activeSubscriptions > 0 ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            
                            {/* Subscriber Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
                              <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{subscriber.recurringSubscriptions}</p>
                                <p className="text-xs text-purple-600 dark:text-purple-400">Recurring</p>
                              </div>
                              <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{subscriber.singleSends}</p>
                                <p className="text-xs text-orange-600 dark:text-orange-400">Single Sends</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{subscriber.totalSubscriptions}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">{subscriber.totalEmailsSent}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Emails Sent</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{subscriber.uniqueLocations}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Locations</p>
                              </div>
                              <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <p className="text-lg font-bold text-teal-600 dark:text-teal-400">
                                  {subscriber.apiRequestCount || 0}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">API Requests</p>
                              </div>
                            </div>
                            
                            {/* Subscription Type Breakdown */}
                            {(subscriber.recurringSubscriptions > 0 || subscriber.singleSends > 0) && (
                              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subscription Activity:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                  {subscriber.recurringSubscriptions > 0 && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Active Recurring:</span>
                                      <span className="font-medium text-purple-600 dark:text-purple-400">
                                        {subscriber.activeRecurringSubscriptions}/{subscriber.recurringSubscriptions}
                                      </span>
                                    </div>
                                  )}
                                  {subscriber.singleSends > 0 && (
                                    <>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Completed Single:</span>
                                        <span className="font-medium text-green-600 dark:text-green-400">
                                          {subscriber.completedSingleSends}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Pending Single:</span>
                                        <span className="font-medium text-orange-600 dark:text-orange-400">
                                          {subscriber.pendingSingleSends}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Location Names */}
                            {subscriber.locationNames.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Locations:</p>
                                <div className="flex flex-wrap gap-1">
                                  {subscriber.locationNames.map(location => (
                                    <span key={location} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded">
                                      {location}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Subscription Schedule Info */}
                            {subscriber.preferredSchedule && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Schedule:</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Days: {subscriber.preferredSchedule.days.map(d => 
                                    ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d]
                                  ).join(', ')} • 
                                  Times: {subscriber.preferredSchedule.times.join(', ')}
                                </p>
                              </div>
                            )}
                            
                            {/* Success Rate */}
                            <div className="mt-3 flex items-center gap-4 text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Success Rate: 
                                <span className={`ml-1 font-medium ${
                                  subscriber.totalEmailsSent > 0 && (subscriber.successfulSends / subscriber.totalEmailsSent) > 0.9
                                    ? 'text-green-600 dark:text-green-400'
                                    : subscriber.totalEmailsSent > 0 && (subscriber.successfulSends / subscriber.totalEmailsSent) > 0.7
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {subscriber.totalEmailsSent > 0 ? 
                                    ((subscriber.successfulSends / subscriber.totalEmailsSent) * 100).toFixed(1) + '%' : 
                                    'N/A'
                                  }
                                </span>
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                Member Since: {new Date(subscriber.firstSubscribed).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => setSelectedSubscriber(selectedSubscriber?.email === subscriber.email ? null : subscriber)}
                              className="gh-btn text-xs px-3 py-1"
                            >
                              {selectedSubscriber?.email === subscriber.email ? 'Hide Details' : 'View Details'}
                            </button>
                            <button
                              onClick={() => handleDeleteSubscriber(subscriber.email)}
                              className="gh-btn bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                              disabled={loading}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete All
                            </button>
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                        {selectedSubscriber?.email === subscriber.email && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Detailed Information</h5>
                            
                            {/* Individual Subscriptions */}
                            <div className="mb-4">
                              <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                All Subscriptions ({subscriber.subscriptions.length})
                              </h6>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {subscriber.subscriptions.map(sub => (
                                  <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                                    <div>
                                      <span className={`px-2 py-1 rounded text-xs mr-2 ${
                                        sub.is_recurring 
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                                      }`}>
                                        {sub.is_recurring ? 'Recurring' : 'One-time'}
                                      </span>
                                      {getScheduleDisplay(sub)}
                                    </div>
                                    <span className={`text-xs ${
                                      sub.enabled 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-red-600 dark:text-red-400'
                                    }`}>
                                      {sub.enabled ? 'Active' : 'Disabled'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Recent Activity */}
                            {subscriber.recentActivity.length > 0 && (
                              <div>
                                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Recent Email Activity ({subscriber.recentActivity.length})
                                </h6>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {subscriber.recentActivity.map(activity => (
                                    <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                                      <div className="flex items-center gap-2">
                                        <div className={getStatusColor(activity.status)}>
                                          {getStatusIcon(activity.status)}
                                        </div>
                                        <span>{new Date(activity.sent_at).toLocaleDateString()}</span>
                                        <span className="text-gray-500">•</span>
                                        <span>{activity.locations_count || 0} locations</span>
                                      </div>
                                      <span className={getStatusColor(activity.status)}>
                                        {activity.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {subscriberProfiles.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No subscribers found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!loading && activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Email Activity ({recentActivity.length})
                </h3>
                
                <div className="space-y-2">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={getStatusColor(activity.status)}>
                            {getStatusIcon(activity.status)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {activity.email_subscriptions?.email || 'Unknown Email'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {activity.email_subscriptions?.name || 'Unknown Name'} • 
                              {activity.email_subscriptions?.is_recurring ? ' Recurring' : ' One-time'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {new Date(activity.sent_at).toLocaleString()} • 
                              {activity.locations_count || 0} location{(activity.locations_count || 0) !== 1 ? 's' : ''}
                            </p>
                            {activity.error_message && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                                Error: {activity.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'sent' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            : activity.status === 'failed'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {recentActivity.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recent email activity found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!loading && activeTab === 'resend' && (
              <div className="space-y-6">
                {!resendService.isConfigured() ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Resend API not configured. Add VITE_RESEND_API_KEY to environment variables.
                    </p>
                  </div>
                ) : resendStats ? (
                  <>
                    {/* Resend Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">Total Emails</h3>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{resendStats.totalEmails}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="font-medium text-green-900 dark:text-green-100">Delivered</h3>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{resendStats.deliveredEmails}</p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {resendStats.totalEmails > 0 ? ((resendStats.deliveredEmails / resendStats.totalEmails) * 100).toFixed(1) : '0'}%
                        </p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <h3 className="font-medium text-red-900 dark:text-red-100">Issues</h3>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                          {resendStats.bouncedEmails + resendStats.complainedEmails}
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {resendStats.bouncedEmails} bounced, {resendStats.complainedEmails} complaints
                        </p>
                      </div>
                    </div>

                    {/* Engagement Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h3 className="font-medium text-purple-900 dark:text-purple-100">Email Opens</h3>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{resendStats.openedEmails}</p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          {resendStats.totalEmails > 0 ? ((resendStats.openedEmails / resendStats.totalEmails) * 100).toFixed(1) : '0'}% open rate
                        </p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                        <h3 className="font-medium text-orange-900 dark:text-orange-100">Email Clicks</h3>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{resendStats.clickedEmails}</p>
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          {resendStats.totalEmails > 0 ? ((resendStats.clickedEmails / resendStats.totalEmails) * 100).toFixed(1) : '0'}% click rate
                        </p>
                      </div>
                    </div>

                    {/* Recent Emails from Resend */}
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Emails (Resend API)</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {resendStats.recentEmails.map(email => (
                          <div key={email.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-white">{email.subject}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  To: {email.to.join(', ')} • From: {email.from}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  {new Date(email.created_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className={getStatusColor(email.status)}>
                                  {getStatusIcon(email.status)}
                                </div>
                                <span className={`text-xs font-medium ${getStatusColor(email.status)}`}>
                                  {email.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {resendStats.recentEmails.length === 0 && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No recent emails found in Resend</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading Resend statistics...</p>
                  </div>
                )}
              </div>
            )}

            {!loading && activeTab === 'coefficients' && (
              <div className="space-y-6">
                {/* Sub-tabs for coefficients */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setCoefficientSubTab('pending')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        coefficientsSubTab === 'pending'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Pending ({pendingCoefficients.length})
                    </button>
                    <button
                      onClick={() => setCoefficientSubTab('approved')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        coefficientsSubTab === 'approved'
                          ? 'border-green-500 text-green-600 dark:text-green-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Approved ({approvedCoefficients.length})
                    </button>
                    <button
                      onClick={() => setCoefficientSubTab('rejected')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        coefficientsSubTab === 'rejected'
                          ? 'border-red-500 text-red-600 dark:text-red-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      Rejected ({rejectedCoefficients.length})
                    </button>
                  </nav>
                </div>

                {/* Pending Coefficients */}
                {coefficientsSubTab === 'pending' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Pending Crop Coefficients ({pendingCoefficients.length})
                    </h3>
                    
                    {pendingCoefficients.length > 0 ? (
                      <div className="space-y-4">
                        {pendingCoefficients.map((pending: any) => (
                          <CoefficientCard 
                            key={pending.id} 
                            coefficient={pending} 
                            status="pending"
                            onApprove={handleApprovePendingCoefficient}
                            onReject={handleRejectPendingCoefficient}
                            onDelete={handleDeleteProcessedCoefficient}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No pending coefficients to review</p>
                        <p className="text-sm mt-1">All user-submitted crop coefficients have been processed</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Approved Coefficients */}
                {coefficientsSubTab === 'approved' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Approved Crop Coefficients ({approvedCoefficients.length})
                    </h3>
                    
                    {approvedCoefficients.length > 0 ? (
                      <div className="space-y-4">
                        {approvedCoefficients.map((coefficient: any) => (
                          <CoefficientCard 
                            key={coefficient.id} 
                            coefficient={coefficient} 
                            status="approved"
                            onDelete={handleDeleteProcessedCoefficient}
                            onEdit={handleEditCoefficient}
                            onRevertToPending={handleRevertToPending}
                            onShowHistory={handleShowAuditHistory}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No approved coefficients yet</p>
                        <p className="text-sm mt-1">Coefficients will appear here after approval</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejected Coefficients */}
                {coefficientsSubTab === 'rejected' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Rejected Crop Coefficients ({rejectedCoefficients.length})
                    </h3>
                    
                    {rejectedCoefficients.length > 0 ? (
                      <div className="space-y-4">
                        {rejectedCoefficients.map((coefficient: any) => (
                          <CoefficientCard 
                            key={coefficient.id} 
                            coefficient={coefficient} 
                            status="rejected"
                            onDelete={handleDeleteProcessedCoefficient}
                            onEdit={handleEditCoefficient}
                            onRevertToPending={handleRevertToPending}
                            onShowHistory={handleShowAuditHistory}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No rejected coefficients yet</p>
                        <p className="text-sm mt-1">Rejected coefficients will appear here for review</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit History Modal */}
      {showAuditModal && selectedCoefficientForAudit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Crop History - {selectedCoefficientForAudit.crop_varieties?.common_name || selectedCoefficientForAudit.crop_varieties?.scientific_name || 'Unknown Variety'}
              </h3>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Crop:</strong> {selectedCoefficientForAudit.crop_varieties?.crop_categories?.category_name || 'Unknown'} - {selectedCoefficientForAudit.crop_varieties?.common_name || selectedCoefficientForAudit.crop_varieties?.scientific_name || 'Unknown Variety'}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                This shows the complete history of all coefficient submissions, approvals, rejections, and edits for this crop variety.
              </p>
            </div>
            
            {auditHistory.length > 0 ? (
              <div className="space-y-4">
                {auditHistory.map((audit: any) => (
                  <div key={audit.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          audit.action_type === 'create' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          audit.action_type === 'update' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          audit.action_type === 'approve' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          audit.action_type === 'reject' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          audit.action_type === 'revert' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          audit.action_type === 'delete' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {audit.action_type.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(audit.created_at).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        by {audit.changed_by}
                      </span>
                    </div>
                    
                    {/* Show submission context for create actions */}
                    {audit.action_type === 'create' && audit.new_values && (
                      <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                        <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">New Submission</h4>
                        <div className="text-sm text-green-800 dark:text-green-300">
                          {audit.new_values.submitted_by_name && (
                            <p><strong>Submitted by:</strong> {audit.new_values.submitted_by_name}</p>
                          )}
                          {audit.new_values.submitted_by_email && (
                            <p><strong>Email:</strong> {audit.new_values.submitted_by_email}</p>
                          )}
                          {audit.new_values.source && (
                            <p><strong>Source:</strong> {audit.new_values.source}</p>
                          )}
                          {audit.new_values.notes && (
                            <p><strong>Notes:</strong> {audit.new_values.notes}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {audit.change_reason && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {audit.change_reason}
                      </p>
                    )}
                    
                    {audit.action_type === 'update' && audit.old_values && audit.new_values && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Previous Values</h4>
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                            {Object.entries(audit.old_values).map(([key, value]: [string, any]) => {
                              if (key.startsWith('kc_') || key.includes('stage_days') || key === 'source' || key === 'notes' || key === 'status') {
                                return (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{key.replace('_', ' ')}:</span>
                                    <span className="font-medium">{value?.toString() || 'null'}</span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">New Values</h4>
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2">
                            {Object.entries(audit.new_values).map(([key, value]: [string, any]) => {
                              if (key.startsWith('kc_') || key.includes('stage_days') || key === 'source' || key === 'notes' || key === 'status') {
                                return (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">{key.replace('_', ' ')}:</span>
                                    <span className="font-medium">{value?.toString() || 'null'}</span>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Show current coefficient values for single-value changes */}
                    {(audit.action_type === 'approve' || audit.action_type === 'reject' || audit.action_type === 'revert') && audit.new_values && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Coefficient Values</h4>
                        <div className="text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div><strong>Kc Initial:</strong> {audit.new_values.kc_initial}</div>
                          <div><strong>Kc Development:</strong> {audit.new_values.kc_development}</div>
                          <div><strong>Kc Mid:</strong> {audit.new_values.kc_mid}</div>
                          <div><strong>Kc Late:</strong> {audit.new_values.kc_late}</div>
                        </div>
                        <div className="text-sm grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          <div><strong>Initial Days:</strong> {audit.new_values.initial_stage_days}</div>
                          <div><strong>Dev Days:</strong> {audit.new_values.development_stage_days}</div>
                          <div><strong>Mid Days:</strong> {audit.new_values.mid_stage_days}</div>
                          <div><strong>Late Days:</strong> {audit.new_values.late_stage_days}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No history available for this crop</p>
                <p className="text-sm mt-1">Activity will be tracked here as you make changes to this crop's coefficients</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};