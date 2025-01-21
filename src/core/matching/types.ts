export interface MatchRequest {
    userId: string;
    skills: string[];
    interests: string[];
    availability: {
        startTime: string;
        endTime: string;
    };
}

export interface Match {
    users: string[];
    matchScore: number;
    commonSkills: string[];
    commonInterests: string[];
}

export interface MatchingMetrics {
    totalMatches: number;
    averageScore: number;
    processingTime: number;
    workerUtilization: number[];
}
