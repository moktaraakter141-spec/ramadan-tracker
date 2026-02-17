import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { toBanglaNum } from '@/lib/bangla';
import { LogOut, Plus, Pencil, Trash2, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';

interface Habit {
  id: string;
  name: string;
  is_custom: boolean;
  sort_order: number;
}

interface HabitEntry {
  id: string;
  habit_id: string;
  day: number;
  completed: boolean;
}

const TOTAL_DAYS = 30;

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('habits').select('*').order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: entries = [] } = useQuery<HabitEntry[]>({
    queryKey: ['habit_entries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('habit_entries').select('*');
      if (error) throw error;
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, day, completed }: { habitId: string; day: number; completed: boolean }) => {
      if (completed) {
        // Insert entry
        const { error } = await supabase.from('habit_entries').insert({
          user_id: user!.id,
          habit_id: habitId,
          day,
          completed: true,
        });
        if (error) throw error;
      } else {
        // Delete entry
        const { error } = await supabase.from('habit_entries').delete()
          .eq('habit_id', habitId)
          .eq('day', day);
        if (error) throw error;
      }
    },
    onMutate: async ({ habitId, day, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['habit_entries'] });
      const prev = queryClient.getQueryData<HabitEntry[]>(['habit_entries']) || [];
      if (completed) {
        queryClient.setQueryData<HabitEntry[]>(['habit_entries'], [
          ...prev,
          { id: 'optimistic', habit_id: habitId, day, completed: true },
        ]);
      } else {
        queryClient.setQueryData<HabitEntry[]>(['habit_entries'],
          prev.filter(e => !(e.habit_id === habitId && e.day === day))
        );
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['habit_entries'], context.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['habit_entries'] }),
  });

  const addHabitMutation = useMutation({
    mutationFn: async (name: string) => {
      const customCount = habits.filter(h => h.is_custom).length;
      if (customCount >= 5) throw new Error('সর্বোচ্চ ৫টি কাস্টম অভ্যাস যোগ করা যায়');
      const { error } = await supabase.from('habits').insert({
        user_id: user!.id,
        name,
        is_custom: true,
        sort_order: habits.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setShowAddModal(false);
      setNewHabitName('');
    },
    onError: (err: any) => toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' }),
  });

  const updateHabitMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('habits').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setEditHabit(null);
      setNewHabitName('');
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  });

  const isChecked = (habitId: string, day: number) =>
    entries.some(e => e.habit_id === habitId && e.day === day && e.completed);

  const totalPossible = habits.length * TOTAL_DAYS;
  const totalCompleted = entries.filter(e => e.completed).length;
  const progressPercent = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  const fullyCompletedDays = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1)
    .filter(day => habits.every(h => isChecked(h.id, day))).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">🌙 রমাদান ট্র্যাকার</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate('/overview')} title="পরিসংখ্যান">
              <BarChart3 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="লগআউট">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 py-6 space-y-6">
        {/* Progress */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between items-baseline text-sm">
              <span className="font-medium">অগ্রগতি</span>
              <span className="text-primary font-bold text-lg">{toBanglaNum(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>সম্পূর্ণ দিন: {toBanglaNum(fullyCompletedDays)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Daily Progress */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm font-medium mb-3">দৈনিক অগ্রগতি</p>
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {Array.from({ length: TOTAL_DAYS }, (_, i) => {
                const day = i + 1;
                const filled = habits.filter(h => isChecked(h.id, day)).length;
                const total = habits.length;
                const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`flex flex-col items-center min-w-[32px] rounded-lg px-1 py-1.5 transition-colors ${
                      isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted/60'
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground mb-1">{toBanglaNum(day)}</span>
                    <div className="w-2 h-8 rounded-full bg-muted overflow-hidden flex flex-col-reverse">
                      <div
                        className="w-full rounded-full bg-primary transition-all duration-300"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-[9px] mt-1 font-medium ${pct === 100 ? 'text-primary' : 'text-muted-foreground'}`}>
                      {toBanglaNum(filled)}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedDay !== null && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-medium mb-2">দিন {toBanglaNum(selectedDay)} — {toBanglaNum(habits.filter(h => isChecked(h.id, selectedDay)).length)}/{toBanglaNum(habits.length)} সম্পন্ন</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {habits.map(h => {
                    const done = isChecked(h.id, selectedDay);
                    return (
                      <div key={h.id} className="flex items-center gap-2 text-xs py-0.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${done ? 'bg-primary' : 'bg-border'}`} />
                        <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{h.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habit Grid */}
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-[5] bg-card min-w-[160px] px-3 py-2 text-left text-sm font-semibold border-b border-r border-border">
                      অভ্যাস
                    </th>
                    {Array.from({ length: TOTAL_DAYS }, (_, i) => (
                      <th key={i} className="px-1 py-2 text-center text-xs font-medium text-muted-foreground border-b border-border min-w-[40px]">
                        {toBanglaNum(i + 1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {habits.map(habit => (
                    <tr key={habit.id} className="group hover:bg-muted/40">
                      <td className="sticky left-0 z-[5] bg-card group-hover:bg-muted/40 px-3 py-2 text-sm border-b border-r border-border">
                        <div className="flex items-center gap-1">
                          <span className="flex-1 truncate">{habit.name}</span>
                          {habit.is_custom && (
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditHabit(habit); setNewHabitName(habit.name); }} className="p-1 rounded hover:bg-accent">
                                <Pencil className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button onClick={() => deleteHabitMutation.mutate(habit.id)} className="p-1 rounded hover:bg-destructive/10">
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      {Array.from({ length: TOTAL_DAYS }, (_, i) => {
                        const day = i + 1;
                        const checked = isChecked(habit.id, day);
                        return (
                          <td key={day} className="px-1 py-1 text-center border-b border-border">
                            <button
                              onClick={() => toggleMutation.mutate({ habitId: habit.id, day, completed: !checked })}
                              className={`w-[32px] h-[32px] md:w-[28px] md:h-[28px] rounded-full border-2 transition-all duration-200 flex items-center justify-center mx-auto ${
                                checked
                                  ? 'bg-primary border-primary text-primary-foreground scale-105'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              aria-label={`${habit.name} দিন ${toBanglaNum(day)}`}
                            >
                              {checked && <span className="text-xs">✓</span>}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Add custom habit */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            নতুন অভ্যাস যোগ করুন
          </Button>
        </div>
      </main>

      <Footer />

      {/* Add Habit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>নতুন অভ্যাস যোগ করুন</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); addHabitMutation.mutate(newHabitName); }}>
            <div className="space-y-3 py-4">
              <Label htmlFor="habit-name">অভ্যাসের নাম</Label>
              <Input id="habit-name" maxLength={40} required value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder="অভ্যাসের নাম লিখুন" />
              <p className="text-xs text-muted-foreground">সর্বোচ্চ ৪০ অক্ষর • {toBanglaNum(habits.filter(h => h.is_custom).length)}/৫ কাস্টম অভ্যাস</p>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addHabitMutation.isPending}>যোগ করুন</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Habit Modal */}
      <Dialog open={!!editHabit} onOpenChange={() => setEditHabit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>অভ্যাস সম্পাদনা</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); if (editHabit) updateHabitMutation.mutate({ id: editHabit.id, name: newHabitName }); }}>
            <div className="space-y-3 py-4">
              <Label htmlFor="edit-name">অভ্যাসের নাম</Label>
              <Input id="edit-name" maxLength={40} required value={newHabitName} onChange={e => setNewHabitName(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateHabitMutation.isPending}>সংরক্ষণ করুন</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
