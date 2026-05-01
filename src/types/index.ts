export interface Match {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  round: string;
  venue: string;
}

export interface Prediction {
  predictionId: string;
  matchId: string;
  predictedHome: number;
  predictedAway: number;
  createdAt: string;
}

export interface SportsDBEvent {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  dateEvent: string;
  strTime: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
  intRound: string;
  strVenue: string;
}
