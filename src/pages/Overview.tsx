import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toBanglaNum } from '@/lib/bangla';
import { ArrowLeft, Download, CheckCircle2, Circle, TrendingUp, CalendarDays, Target, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';

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

const Overview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const statsRef = useRef<HTMLDivElement>(null);

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

  const totalPossible = habits.length * TOTAL_DAYS;
  const totalCompleted = entries.filter(e => e.completed).length;
  const totalRemaining = totalPossible - totalCompleted;
  const overallPercent = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  // Per-day stats
  const daysWithActivity = new Set(entries.filter(e => e.completed).map(e => e.day));
  const activeDays = daysWithActivity.size;
  const dailyAvg = activeDays > 0 ? (totalCompleted / activeDays) : 0;
  const dailyAvgPercent = habits.length > 0 ? Math.round((dailyAvg / habits.length) * 100) : 0;

  const fullyCompletedDays = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1)
    .filter(day => habits.every(h => entries.some(e => e.habit_id === h.id && e.day === day && e.completed))).length;

  // Per-habit stats
  const habitStats = habits.map(h => {
    const completed = entries.filter(e => e.habit_id === h.id && e.completed).length;
    return { ...h, completed, percent: Math.round((completed / TOTAL_DAYS) * 100) };
  }).sort((a, b) => b.percent - a.percent);

  // Best streak (consecutive fully completed days)
  let bestStreak = 0;
  let currentStreak = 0;
  for (let d = 1; d <= TOTAL_DAYS; d++) {
    const allDone = habits.every(h => entries.some(e => e.habit_id === h.id && e.day === d && e.completed));
    if (allDone && habits.length > 0) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  const handleDownload = async () => {
    if (!statsRef.current) return;
    try {
      const dataUrl = await toPng(statsRef.current, {
        backgroundColor: '#f7f5f0',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = 'ramadan-tracker-stats.png';
      link.href = dataUrl;
      link.click();
      toast({ title: 'ডাউনলোড সম্পন্ন!' });
    } catch {
      toast({ title: 'ত্রুটি', description: 'ছবি ডাউনলোড করতে সমস্যা হয়েছে', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-[700px] mx-auto flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">📊 পরিসংখ্যান</h1>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            শেয়ার
          </Button>
        </div>
      </header>

      <main className="max-w-[700px] mx-auto px-4 py-6">
        <div ref={statsRef} className="space-y-4 p-1">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-border/60">
              <CardContent className="pt-5 pb-4 flex flex-col items-center text-center gap-1">
                <CheckCircle2 className="h-6 w-6 text-primary mb-1" />
                <span className="text-2xl font-bold text-primary">{toBanglaNum(totalCompleted)}</span>
                <span className="text-xs text-muted-foreground">সম্পন্ন</span>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-5 pb-4 flex flex-col items-center text-center gap-1">
                <Circle className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-2xl font-bold">{toBanglaNum(totalRemaining)}</span>
                <span className="text-xs text-muted-foreground">বাকি আছে</span>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-5 pb-4 flex flex-col items-center text-center gap-1">
                <TrendingUp className="h-6 w-6 text-primary mb-1" />
                <span className="text-2xl font-bold text-primary">{toBanglaNum(dailyAvgPercent)}%</span>
                <span className="text-xs text-muted-foreground">দৈনিক গড়</span>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="pt-5 pb-4 flex flex-col items-center text-center gap-1">
                <CalendarDays className="h-6 w-6 text-primary mb-1" />
                <span className="text-2xl font-bold text-primary">{toBanglaNum(fullyCompletedDays)}</span>
                <span className="text-xs text-muted-foreground">পূর্ণ দিন</span>
              </CardContent>
            </Card>
          </div>

          {/* Overall + Streak */}
          <Card className="border-border/60">
            <CardContent className="pt-5 pb-4 space-y-3">
              <div className="flex justify-between items-baseline text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-medium">সামগ্রিক অগ্রগতি</span>
                </div>
                <span className="text-primary font-bold text-lg">{toBanglaNum(overallPercent)}%</span>
              </div>
              <Progress value={overallPercent} className="h-3" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                <Award className="h-4 w-4" />
                <span>সেরা ধারাবাহিকতা: {toBanglaNum(bestStreak)} দিন</span>
              </div>
            </CardContent>
          </Card>

          {/* Per Habit Breakdown */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 pt-5">
              <CardTitle className="text-sm font-semibold">অভ্যাসভিত্তিক অগ্রগতি</CardTitle>
            </CardHeader>
            <CardContent className="pb-5 space-y-3">
              {habitStats.map(h => (
                <div key={h.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate max-w-[200px]">{h.name}</span>
                    <span className="text-muted-foreground font-medium ml-2">
                      {toBanglaNum(h.completed)}/{toBanglaNum(TOTAL_DAYS)}
                    </span>
                  </div>
                  <Progress value={h.percent} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Watermark for share */}
          <p className="text-center text-[10px] text-muted-foreground/50 pt-2">🌙 রমাদান ট্র্যাকার</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Overview;
