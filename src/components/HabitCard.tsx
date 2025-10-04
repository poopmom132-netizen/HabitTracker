import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, RotateCcw, Trash2, Play, FileText, Clock } from 'lucide-react';

interface Habit {
  id: string;
  title: string;
  start_date: string;
  current_streak: number;
  longest_streak: number;
  last_reset_date: string | null;
  last_tracked_at: string | null;
}

interface HabitCardProps {
  habit: Habit;
  onUpdate: () => void;
}

interface HabitLog {
  id: string;
  log_date: string;
  status: string;
  notes: string;
}

export default function HabitCard({ habit, onUpdate }: HabitCardProps) {
  const [loading, setLoading] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [recentLogs, setRecentLogs] = useState<HabitLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [canTrack, setCanTrack] = useState(true);

  useEffect(() => {
    fetchRecentLogs();
    calculateTimeElapsed();

    const interval = setInterval(() => {
      calculateTimeElapsed();
    }, 1000);

    return () => clearInterval(interval);
  }, [habit.id, habit.last_tracked_at]);

  const calculateTimeElapsed = () => {
    if (!habit.last_tracked_at) {
      setCanTrack(true);
      setTimeRemaining('0d 0h 0m');
      return;
    }

    const lastTracked = new Date(habit.last_tracked_at).getTime();
    const now = new Date().getTime();
    const elapsed = now - lastTracked;

    const days = Math.floor(elapsed / (24 * 60 * 60 * 1000));
    const hours = Math.floor((elapsed % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((elapsed % (60 * 60 * 1000)) / (60 * 1000));

    setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    setCanTrack(true);
  };

  const fetchRecentLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habit.id)
        .order('log_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching logs:', error.message);
    }
  };

  const calculateDaysSinceStart = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleStartTracking = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('habits')
        .update({
          last_tracked_at: now,
          updated_at: now,
        })
        .eq('id', habit.id);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habit.id,
          status: 'success',
          log_date: new Date().toISOString().split('T')[0],
          notes: '',
        });

      if (logError) throw logError;

      fetchRecentLogs();
      onUpdate();
    } catch (error: any) {
      console.error('Error starting tracking:', error.message);
      alert('Failed to start tracking');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habit.id,
          status: 'note',
          log_date: new Date().toISOString().split('T')[0],
          notes: notes,
        });

      if (error) throw error;

      setNotes('');
      setShowNotesModal(false);
      fetchRecentLogs();
    } catch (error: any) {
      console.error('Error adding note:', error.message);
      alert('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('habits')
        .update({
          current_streak: 0,
          last_reset_date: new Date().toISOString(),
          last_tracked_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habit.id);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habit.id,
          status: 'reset',
          log_date: new Date().toISOString().split('T')[0],
          notes: resetReason,
        });

      if (logError) throw logError;

      setResetReason('');
      setShowResetModal(false);
      fetchRecentLogs();
      onUpdate();
    } catch (error: any) {
      console.error('Error resetting streak:', error.message);
      alert('Failed to reset streak');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${habit.title}"? This will remove all associated data.`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habit.id);

      if (error) throw error;

      onUpdate();
    } catch (error: any) {
      console.error('Error deleting habit:', error.message);
      alert('Failed to delete habit');
    } finally {
      setLoading(false);
    }
  };

  const daysSinceStart = calculateDaysSinceStart(habit.start_date);
  const successRate = daysSinceStart > 0
    ? Math.round((habit.current_streak / daysSinceStart) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">{habit.title}</h3>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-gray-400 hover:text-red-500 transition disabled:opacity-50"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-6">
        <div className="text-center mb-4">
          <div className="text-5xl font-bold text-emerald-600 mb-1">
            {habit.current_streak}
          </div>
          <div className="text-gray-600 text-sm">days clean</div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-teal-50 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1 text-teal-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Best</span>
            </div>
            <div className="text-2xl font-bold text-teal-700">
              {habit.longest_streak}
            </div>
          </div>

          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="text-sm font-medium text-emerald-600 mb-1">
              Total Days
            </div>
            <div className="text-2xl font-bold text-emerald-700">
              {daysSinceStart}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-center gap-2 text-blue-700">
          <Clock className="w-5 h-5" />
          <div className="text-center">
            <div className="text-sm font-medium">Time elapsed</div>
            <div className="text-xl font-bold">{timeRemaining}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleStartTracking}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5" />
          Start Tracking
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowNotesModal(true)}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            Add Note
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {recentLogs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition mb-2"
          >
            <FileText className="w-4 h-4" />
            <span>{showLogs ? 'Hide' : 'Show'} Recent Activity</span>
          </button>

          {showLogs && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded-lg text-xs ${
                    log.status === 'reset'
                      ? 'bg-red-50 border border-red-200'
                      : log.status === 'note'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700">
                      {new Date(log.log_date).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.status === 'reset'
                          ? 'bg-red-200 text-red-800'
                          : log.status === 'note'
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-emerald-200 text-emerald-800'
                      }`}
                    >
                      {log.status === 'reset' ? 'Reset' : log.status === 'note' ? 'Note' : 'Check-in'}
                    </span>
                  </div>
                  {log.notes && (
                    <p className="text-gray-600 italic">"{log.notes}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add a Note</h3>
            <p className="text-gray-600 mb-4">
              Record your thoughts, feelings, or observations
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling? What's on your mind?"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setNotes('');
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={loading || !notes.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Reset Streak</h3>
            <p className="text-gray-600 mb-4">
              This will reset your current streak to 0. Please tell us why:
            </p>
            <textarea
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              placeholder="What happened? What triggered this? What can you learn?"
              rows={4}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetReason('');
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={loading || !resetReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
