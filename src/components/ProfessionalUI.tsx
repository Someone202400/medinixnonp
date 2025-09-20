import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  Pill, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Activity
} from 'lucide-react';

interface MedicationCardProps {
  name: string;
  dosage: string;
  time: string;
  status: 'taken' | 'pending' | 'missed' | 'upcoming';
  onMarkTaken?: () => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  name,
  dosage,
  time,
  status,
  onMarkTaken
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'taken':
        return {
          badge: 'bg-success/20 text-success border-success/30',
          icon: CheckCircle,
          iconColor: 'text-success',
          cardBorder: 'border-success/30',
          cardBg: 'bg-success/5'
        };
      case 'missed':
        return {
          badge: 'bg-destructive/20 text-destructive border-destructive/30',
          icon: AlertTriangle,
          iconColor: 'text-destructive',
          cardBorder: 'border-destructive/30',
          cardBg: 'bg-destructive/5'
        };
      case 'pending':
        return {
          badge: 'bg-warning/20 text-warning border-warning/30',
          icon: Clock,
          iconColor: 'text-warning',
          cardBorder: 'border-warning/30',
          cardBg: 'bg-warning/5'
        };
      default:
        return {
          badge: 'bg-primary/20 text-primary border-primary/30',
          icon: Calendar,
          iconColor: 'text-primary',
          cardBorder: 'border-primary/30',
          cardBg: 'bg-primary/5'
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  return (
    <Card className={`${config.cardBg} ${config.cardBorder} border-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ${config.cardBorder} border`}>
              <Pill className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{name}</h3>
              <p className="text-sm text-muted-foreground">{dosage}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {time}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={config.badge}>
              <StatusIcon className={`h-3 w-3 mr-1 ${config.iconColor}`} />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            
            {status === 'pending' && onMarkTaken && (
              <Button
                size="sm"
                onClick={onMarkTaken}
                className="bg-success hover:bg-success/90 text-success-foreground shadow-lg"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Take
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface AdherenceDisplayProps {
  percentage: number;
  weeklyData?: number[];
  streak?: number;
}

export const AdherenceDisplay: React.FC<AdherenceDisplayProps> = ({
  percentage,
  weeklyData = [],
  streak = 0
}) => {
  const getPercentageColor = () => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card className="bg-gradient-to-br from-card to-card/90 border-2 border-primary/20 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          <TrendingUp className="h-5 w-5 text-primary" />
          Adherence Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Percentage */}
        <div className="text-center space-y-2">
          <div className={`text-4xl font-bold ${getPercentageColor()}`}>
            {percentage.toFixed(1)}%
          </div>
          <p className="text-muted-foreground">Overall Adherence</p>
          <Progress 
            value={percentage} 
            className="h-3"
            style={{
              ['--progress-background' as any]: getProgressColor()
            }}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-2xl font-bold text-primary">{streak}</div>
            <p className="text-xs text-muted-foreground">Day Streak</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className="text-2xl font-bold text-accent">
              {weeklyData.length > 0 ? weeklyData[weeklyData.length - 1]?.toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">This Week</p>
          </div>
        </div>

        {/* Weekly Chart */}
        {weeklyData.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Last 7 Days</p>
            <div className="flex items-end gap-1 h-20">
              {weeklyData.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-primary/60 to-primary/20 rounded-t"
                  style={{ height: `${(value / 100) * 100}%` }}
                  title={`Day ${index + 1}: ${value.toFixed(1)}%`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = 'neutral',
  color = 'primary'
}) => {
  const getColorClasses = () => {
    const colors = {
      primary: 'text-primary bg-primary/10 border-primary/20',
      success: 'text-success bg-success/10 border-success/20',
      warning: 'text-warning bg-warning/10 border-warning/20',
      destructive: 'text-destructive bg-destructive/10 border-destructive/20'
    };
    return colors[color];
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↗️';
    if (trend === 'down') return '↘️';
    return '';
  };

  return (
    <Card className={`${getColorClasses()} border-2 shadow-lg hover:shadow-xl transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">{value}</span>
              {trend !== 'neutral' && (
                <span className="text-sm">{getTrendIcon()}</span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${getColorClasses()} flex items-center justify-center`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface QuickActionButtonProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'primary' | 'success' | 'warning' | 'accent';
  loading?: boolean;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  description,
  icon: Icon,
  onClick,
  variant = 'primary',
  loading = false
}) => {
  const getVariantClasses = () => {
    const variants = {
      primary: 'bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 text-primary hover:from-primary/30 hover:to-primary/20',
      success: 'bg-gradient-to-br from-success/20 to-success/10 border-success/30 text-success hover:from-success/30 hover:to-success/20',
      warning: 'bg-gradient-to-br from-warning/20 to-warning/10 border-warning/30 text-warning hover:from-warning/30 hover:to-warning/20',
      accent: 'bg-gradient-to-br from-accent/20 to-accent/10 border-accent/30 text-accent hover:from-accent/30 hover:to-accent/20'
    };
    return variants[variant];
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`group p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 hover:shadow-xl text-left w-full disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClasses()}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg bg-gradient-to-br from-card to-card/80`}>
          {loading ? (
            <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Icon className="h-6 w-6" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1 group-hover:text-opacity-80 transition-colors">
            {title}
          </h3>
          <p className="text-sm opacity-70 group-hover:opacity-60 transition-opacity">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
};

export default {
  MedicationCard,
  AdherenceDisplay,
  StatsCard,
  QuickActionButton
};