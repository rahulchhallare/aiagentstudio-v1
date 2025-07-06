// Auto-deployment system for missing AI agents
import { allAgentTemplates, type AgentTemplate } from "./agent-templates";
import { db } from "./db";
import { agents } from "../shared/schema";

export class AgentAutoDeployer {
  private deployedAgents: Set<string> = new Set();

  async deployAllMissingAgents(platformUserId: number = 1): Promise<void> {
    console.log("Starting auto-deployment of missing AI agents...");
    
    for (const template of allAgentTemplates) {
      try {
        await this.deployAgentFromTemplate(template, platformUserId);
        console.log(`✓ Deployed: ${template.name}`);
        this.deployedAgents.add(template.id);
      } catch (error) {
        console.error(`✗ Failed to deploy ${template.name}:`, error);
      }
    }

    console.log(`Deployment complete. Successfully deployed ${this.deployedAgents.size}/${allAgentTemplates.length} agents.`);
  }

  private async deployAgentFromTemplate(template: AgentTemplate, userId: number): Promise<any> {
    // Generate unique deployment ID
    const deployId = `auto-${template.id}-${Date.now()}`;
    const deployUrl = `https://aiagent-studio.ai/agent/${deployId}`;

    // Create agent in database
    const agentData = {
      user_id: userId,
      name: template.name,
      description: template.description,
      flow_data: template.flowData,
      is_active: true,
      deploy_id: deployId,
      deploy_url: deployUrl
    };

    // Insert into database
    const [newAgent] = await db.insert(agents).values(agentData).returning();
    
    return newAgent;
  }

  async getDeploymentStatus(): Promise<{
    total: number;
    deployed: number;
    missing: string[];
    available: string[];
  }> {
    const total = allAgentTemplates.length;
    const deployed = this.deployedAgents.size;
    const missing = allAgentTemplates
      .filter(t => !this.deployedAgents.has(t.id))
      .map(t => t.name);
    const available = allAgentTemplates
      .filter(t => this.deployedAgents.has(t.id))
      .map(t => t.name);

    return { total, deployed, missing, available };
  }

  async deploySpecificAgent(templateId: string, userId: number = 1): Promise<any> {
    const template = allAgentTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return await this.deployAgentFromTemplate(template, userId);
  }

  getAvailableTemplates(): AgentTemplate[] {
    return allAgentTemplates;
  }

  getTemplatesByCategory(): Record<string, AgentTemplate[]> {
    const categories: Record<string, AgentTemplate[]> = {
      'Customer Support': [],
      'Sales & Marketing': [],
      'Analytics & Intelligence': [],
      'Operations & Automation': [],
      'Industry Specific': []
    };

    for (const template of allAgentTemplates) {
      const type = template.solutionType;
      
      if (type.includes('Customer') || type.includes('Support') || type.includes('Chatbot')) {
        categories['Customer Support'].push(template);
      } else if (type.includes('Sales') || type.includes('Marketing') || type.includes('Lead') || type.includes('Personalization')) {
        categories['Sales & Marketing'].push(template);
      } else if (type.includes('Analytics') || type.includes('Intelligence') || type.includes('Feedback') || type.includes('Predictive')) {
        categories['Analytics & Intelligence'].push(template);
      } else if (type.includes('Monitoring') || type.includes('Performance')) {
        categories['Operations & Automation'].push(template);
      } else {
        categories['Industry Specific'].push(template);
      }
    }

    return categories;
  }
}

export const agentAutoDeployer = new AgentAutoDeployer();