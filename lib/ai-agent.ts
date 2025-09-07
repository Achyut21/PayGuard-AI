// Note: OpenAI client removed - now using API route for security
// The OpenAI API key should only be used server-side

export interface ShoppingRequest {
  query: string;
  budget: number;
  preferences?: string;
}

export interface ProductRecommendation {
  name: string;
  description: string;
  price: number;
  vendor: string;
  reason: string;
  url?: string;
}

export interface ShoppingResponse {
  recommendations: ProductRecommendation[];
  totalCost: number;
  reasoning: string;
}

// AI Shopping Agent class
export class AIShoppingAgent {
  private agentId: string;
  private spendingLimit: number;
  private context: string[];

  constructor(agentId: string, spendingLimit: number) {
    this.agentId = agentId;
    this.spendingLimit = spendingLimit;
    this.context = [];
  }
  async searchProducts(request: ShoppingRequest): Promise<ShoppingResponse> {
    try {
      const systemPrompt = `You are an AI shopping assistant with a budget of ${this.spendingLimit / 1000000} ALGO (approximately $${(this.spendingLimit / 1000000 * 0.15).toFixed(2)} USD).
      
Your task is to find the best products matching the user's request within their budget.
Format your response as a JSON object with product recommendations.

Guidelines:
- Stay within the specified budget
- Provide realistic product recommendations
- Include vendor information
- Explain why each product is recommended
- Consider user preferences if provided`;

      const userPrompt = `Find products for: "${request.query}"
Budget: ${request.budget / 1000000} ALGO ($${(request.budget / 1000000 * 0.15).toFixed(2)} USD)
${request.preferences ? `Preferences: ${request.preferences}` : ''}

Return a JSON object with:
{
  "recommendations": [
    {
      "name": "Product name",
      "description": "Brief description",
      "price": price_in_microalgos,
      "vendor": "Vendor name",
      "reason": "Why this product is recommended",
      "url": "optional_product_url"
    }
  ],
  "totalCost": total_in_microalgos,
  "reasoning": "Overall shopping strategy"
}`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search products');
      }

      const data = await response.json();
      
      let result;
      try {
        result = JSON.parse(data.content || '{}');
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        // Fallback response
        result = {
          recommendations: [],
          totalCost: 0,
          reasoning: 'Unable to process the search request. Please try again.'
        };
      }
      
      // Add to context for future conversations
      this.context.push(`Searched for: ${request.query}, Found ${result.recommendations?.length || 0} products`);
      
      return result as ShoppingResponse;
    } catch (error) {
      console.error('AI search error:', error);
      return {
        recommendations: [],
        totalCost: 0,
        reasoning: 'Failed to search products'
      };
    }
  }
  async chat(message: string): Promise<string> {
    try {
      const systemPrompt = `You are a helpful AI shopping assistant for PayGuard AI.
You have a spending limit of ${this.spendingLimit / 1000000} ALGO.
You can help users find products, compare prices, and make purchase recommendations.
Be friendly, helpful, and always stay within budget constraints.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          messages: [
            ...this.context.slice(-5).map(ctx => ({ role: 'assistant', content: ctx })),
            { role: 'user', content: message }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      const aiResponse = data.content || 'I apologize, but I couldn\'t process that request.';
      this.context.push(aiResponse);
      
      return aiResponse;
    } catch (error) {
      console.error('AI chat error:', error);
      return 'I apologize, but I\'m having trouble connecting to the AI service.';
    }
  }

  async requestPurchase(product: ProductRecommendation, recipientAddress: string): Promise<{
    success: boolean;
    requestId?: number;
    message: string;
  }> {
    try {
      // Check if purchase is within remaining budget
      if (product.price > this.spendingLimit) {
        return {
          success: false,
          message: 'Purchase exceeds spending limit'
        };
      }

      // Make API call to request payment
      const response = await fetch('/api/agent/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: this.agentId,
          amount: product.price,
          recipient: recipientAddress,
          reason: `Purchase: ${product.name} from ${product.vendor}`
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.context.push(`Requested purchase of ${product.name} for ${product.price / 1000000} ALGO`);
        return {
          success: true,
          requestId: data.requestId,
          message: data.autoApproved 
            ? 'Purchase automatically approved!' 
            : 'Purchase request sent for approval'
        };
      }

      return {
        success: false,
        message: data.error || 'Failed to request purchase'
      };
    } catch (error) {
      console.error('Purchase request error:', error);
      return {
        success: false,
        message: 'Failed to request purchase'
      };
    }
  }

  getContext(): string[] {
    return this.context;
  }

  clearContext(): void {
    this.context = [];
  }
}

// Factory function to create AI agents
export function createAIAgent(agentId: string, spendingLimit: number): AIShoppingAgent {
  return new AIShoppingAgent(agentId, spendingLimit);
}