import { 
  business_analyses, ai_recommendations,
  type BusinessAnalysis, type InsertBusinessAnalysis,
  type AiRecommendation, type InsertAiRecommendation
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export class DatabaseStorage {
  // Business Analysis methods
  async createBusinessAnalysis(insertBusinessAnalysis: InsertBusinessAnalysis): Promise<BusinessAnalysis> {
    const [analysis] = await db.insert(business_analyses).values(insertBusinessAnalysis).returning();
    return analysis;
  }

  async getBusinessAnalysis(id: number): Promise<BusinessAnalysis | undefined> {
    const [analysis] = await db.select().from(business_analyses).where(eq(business_analyses.id, id));
    return analysis || undefined;
  }

  async createAiRecommendation(insertAiRecommendation: InsertAiRecommendation): Promise<AiRecommendation> {
    const [recommendation] = await db.insert(ai_recommendations).values(insertAiRecommendation).returning();
    return recommendation;
  }

  async getRecommendationsByAnalysisId(analysisId: number): Promise<AiRecommendation[]> {
    return await db.select().from(ai_recommendations).where(eq(ai_recommendations.analysis_id, analysisId));
  }

  async updateRecommendationStatus(id: number, status: string): Promise<void> {
    await db.update(ai_recommendations).set({ status }).where(eq(ai_recommendations.id, id));
  }
}

export const databaseStorage = new DatabaseStorage();