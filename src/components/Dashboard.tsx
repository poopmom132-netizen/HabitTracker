import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, LogOut, Calendar, TrendingUp, RotateCcw } from 'lucide-react';
import HabitCard from './HabitCard';
import CreateHabitModal from './CreateHabitModal';

interface Habit {
  id: string;
  title: string;
  start_date: string;
  current_streak: number;
  longest_streak: number;
  last_reset_date: string | null;
  last_tracked_at: string | null;
}

export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHabits(data || []);
    } catch (error: any) {
      console.error('Error fetching habits:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleHabitCreated = () => {
    setShowCreateModal(false);
    fetchHabits();
  };

  const handleHabitUpdated = () => {
    fetchHabits();
  };

  const calculateDaysSinceStart = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Streak Tracker</h1>
            <p className="text-gray-600">Track your progress, build better habits</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : habits.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Start Your Journey</h2>
            <p className="text-gray-600 mb-6">
              Create your first habit tracker and start building streaks
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Create Habit
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition"
              >
                <Plus className="w-5 h-5" />
                New Habit
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onUpdate={handleHabitUpdated}
                />
              ))}
            </div>
          </>
        )}

        {showCreateModal && (
          <CreateHabitModal
            onClose={() => setShowCreateModal(false)}
            onCreated={handleHabitCreated}
          />
        )}
      </div>
    </div>
  );
}
