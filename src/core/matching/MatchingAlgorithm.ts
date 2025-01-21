import { MatchRequest, Match } from './types';

export class MatchingAlgorithm {
    private static calculateSkillMatch(skills1: string[], skills2: string[]): number {
        const commonSkills = skills1.filter(skill => skills2.includes(skill));
        return commonSkills.length / Math.max(skills1.length, skills2.length);
    }

    private static calculateInterestMatch(interests1: string[], interests2: string[]): number {
        const commonInterests = interests1.filter(interest => interests2.includes(interest));
        return commonInterests.length / Math.max(interests1.length, interests2.length);
    }

    private static calculateAvailabilityOverlap(
        availability1: { startTime: string; endTime: string },
        availability2: { startTime: string; endTime: string }
    ): number {
        const start1 = new Date(availability1.startTime).getTime();
        const end1 = new Date(availability1.endTime).getTime();
        const start2 = new Date(availability2.startTime).getTime();
        const end2 = new Date(availability2.endTime).getTime();

        const overlapStart = Math.max(start1, start2);
        const overlapEnd = Math.min(end1, end2);

        if (overlapEnd <= overlapStart) return 0;

        const overlap = overlapEnd - overlapStart;
        const totalTime = Math.max(end1, end2) - Math.min(start1, start2);
        
        return overlap / totalTime;
    }

    public static findMatches(request: MatchRequest, candidates: MatchRequest[]): Match[] {
        return candidates
            .filter(candidate => candidate.userId !== request.userId)
            .map(candidate => {
                const skillMatch = this.calculateSkillMatch(request.skills, candidate.skills);
                const interestMatch = this.calculateInterestMatch(request.interests, candidate.interests);
                const availabilityMatch = this.calculateAvailabilityOverlap(
                    request.availability,
                    candidate.availability
                );

                // Calculate weighted match score
                const matchScore = (
                    skillMatch * 0.4 +
                    interestMatch * 0.4 +
                    availabilityMatch * 0.2
                );

                return {
                    users: [request.userId, candidate.userId],
                    matchScore,
                    commonSkills: request.skills.filter(skill => 
                        candidate.skills.includes(skill)
                    ),
                    commonInterests: request.interests.filter(interest => 
                        candidate.interests.includes(interest)
                    )
                };
            })
            .filter(match => match.matchScore >= 0.6) // Minimum match threshold
            .sort((a, b) => b.matchScore - a.matchScore);
    }
}
