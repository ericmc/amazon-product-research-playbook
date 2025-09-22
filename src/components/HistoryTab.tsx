import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Database, 
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { SavedOpportunity } from '@/utils/OpportunityStorage';
import { getRefreshHistoryEntries, getScoreHistory } from '@/utils/refreshUtils';

interface HistoryTabProps {
  opportunity: SavedOpportunity;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ opportunity }) => {
  const history = opportunity.history || [];
  const refreshHistory = getRefreshHistoryEntries(opportunity);
  const scoreHistory = getScoreHistory(opportunity);

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'jungle-scout':
        return <span className="text-green-600">JS</span>;
      case 'helium-10':
        return <span className="text-blue-600">H10</span>;
      case 'product-opportunity-explorer':
        return <span className="text-purple-600">POE</span>;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'refresh':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'validation':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'decision':
        return <Database className="h-4 w-4 text-purple-600" />;
      case 'import':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      default:
        return <Calendar className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreTrend = (entry: any) => {
    if (entry.scoreChange === undefined) return null;
    
    const change = entry.scoreChange;
    if (change === 0) return null;
    
    return (
      <div className={`flex items-center gap-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {change > 0 ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span className="text-xs font-medium">
          {change > 0 ? '+' : ''}{change} pts
        </span>
      </div>
    );
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No History Yet</h3>
          <p className="text-muted-foreground">
            Activity history will appear here as you refresh data and make updates.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Trend Summary */}
      {scoreHistory.length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Score Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scoreHistory.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{formatDate(entry.date)}</span>
                  <Badge variant="outline">{entry.score}</Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Current score: {opportunity.finalScore} | 
              Total change: {scoreHistory.length > 1 ? 
                `${scoreHistory[scoreHistory.length - 1].score - scoreHistory[0].score > 0 ? '+' : ''}${scoreHistory[scoreHistory.length - 1].score - scoreHistory[0].score} pts` : 
                'No changes'
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh History */}
      {refreshHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Data Refresh Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {refreshHistory.map((entry, index) => (
                <div key={index} className="flex items-start gap-3 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {getSourceIcon(entry.source)}
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{entry.summary}</div>
                        {getScoreTrend(entry)}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDate(entry.date)}</div>
                      {entry.notes && (
                        <div className="text-xs text-muted-foreground mt-1 italic">
                          "{entry.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Activity Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Full Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(entry.type)}
                  <div className="h-2 w-2 bg-muted-foreground rounded-full"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{entry.summary}</div>
                    <div className="flex items-center gap-2">
                      {getScoreTrend(entry)}
                      {entry.source && (
                        <Badge variant="outline" className="text-xs">
                          {entry.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(entry.date)}</div>
                  {entry.notes && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      "{entry.notes}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryTab;