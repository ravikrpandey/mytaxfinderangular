import { AfterViewInit, Component, OnDestroy } from '@angular/core';

type MessageSender = 'user' | 'ai';

interface FinancialGoal {
  name: string;
  target: number;
  current: number;
  monthly: number;
}

interface FinancialData {
  monthlyIncome: number;
  monthlyExpenses: number;
  investments: number;
  savings: number;
  goals: FinancialGoal[];
  expenses: Record<string, number>;
}

interface WindowFinancialAiHandlers {
  handleKeyPress: (event: KeyboardEvent) => void;
  sendMessage: () => void;
  askAI: (question: string) => void;
  openFinancialPlanModal: () => void;
  closeFinancialPlanModal: () => void;
}

declare global {
  interface Window extends Partial<WindowFinancialAiHandlers> {}
}

@Component({
  selector: 'app-financial-planning-ai',
  standalone: true,
  imports: [],
  templateUrl: './financial-planning-ai.component.html',
  styleUrl: './financial-planning-ai.component.scss'
})
export class FinancialPlanningAiComponent implements AfterViewInit, OnDestroy {
  private readonly financialData: FinancialData = {
    monthlyIncome: 850000,
    monthlyExpenses: 325000,
    investments: 450000,
    savings: 525000,
    goals: [
      { name: 'House Down Payment', target: 2000000, current: 1300000, monthly: 25000 },
      { name: 'Child Education', target: 1500000, current: 630000, monthly: 15000 },
      { name: 'Retirement', target: 10000000, current: 2800000, monthly: 20000 }
    ],
    expenses: {
      housing: 45000,
      food: 25000,
      transportation: 15000,
      utilities: 8000,
      entertainment: 12000,
      healthcare: 10000,
      other: 10000
    }
  };

  ngAfterViewInit(): void {
    window.handleKeyPress = this.handleKeyPress.bind(this);
    window.sendMessage = this.sendMessage.bind(this);
    window.askAI = this.askAI.bind(this);
    window.openFinancialPlanModal = this.openFinancialPlanModal.bind(this);
    window.closeFinancialPlanModal = this.closeFinancialPlanModal.bind(this);

    const modal = document.getElementById('financialPlanModal');
    modal?.addEventListener('click', this.onModalBackdropClick);
  }

  ngOnDestroy(): void {
    const modal = document.getElementById('financialPlanModal');
    modal?.removeEventListener('click', this.onModalBackdropClick);

    delete window.handleKeyPress;
    delete window.sendMessage;
    delete window.askAI;
    delete window.openFinancialPlanModal;
    delete window.closeFinancialPlanModal;
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      void this.sendMessage();
    }
  }

  async sendMessage(): Promise<void> {
    const input = document.getElementById('chatInput') as HTMLInputElement | null;
    const message = input?.value.trim() ?? '';

    if (!message || !input) {
      return;
    }

    this.addMessageToChat(message, 'user');
    input.value = '';
    this.showTypingIndicator();

    try {
      const response = await this.getAIResponse(message);
      this.removeTypingIndicator();
      this.addMessageToChat(response, 'ai');
    } catch {
      this.removeTypingIndicator();
      this.addMessageToChat('I apologize, but I encountered an error. Please try again.', 'ai');
    }
  }

  askAI(question: string): void {
    const input = document.getElementById('chatInput') as HTMLInputElement | null;
    if (!input) {
      return;
    }

    input.value = question;
    void this.sendMessage();
  }

  async openFinancialPlanModal(): Promise<void> {
    const modal = document.getElementById('financialPlanModal');
    modal?.classList.add('active');
    await this.generateFinancialPlan();
  }

  closeFinancialPlanModal(): void {
    const modal = document.getElementById('financialPlanModal');
    modal?.classList.remove('active');
  }

  private readonly onModalBackdropClick = (event: Event): void => {
    if (event.target === event.currentTarget) {
      this.closeFinancialPlanModal();
    }
  };

  private addMessageToChat(message: string, sender: MessageSender): void {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) {
      return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message flex gap-3';

    if (sender === 'user') {
      messageDiv.innerHTML = `
        <div class="ml-auto flex gap-3 flex-row-reverse">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex-shrink-0 flex items-center justify-center">
            <span class="text-white text-sm font-semibold">You</span>
          </div>
          <div class="bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-2xl rounded-tr-none p-4 shadow-sm max-w-2xl">
            <p>${this.escapeHtml(message)}</p>
          </div>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm max-w-2xl">
          <p class="text-gray-800">${this.escapeHtml(message)}</p>
        </div>
      `;
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  private showTypingIndicator(): void {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) {
      return;
    }

    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'chat-message flex gap-3';
    typingDiv.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>
      <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  private removeTypingIndicator(): void {
    const indicator = document.getElementById('typingIndicator');
    indicator?.remove();
  }

  private async getAIResponse(userMessage: string): Promise<string> {
    const context = `
User's Financial Profile:
- Monthly Income: ₹${this.financialData.monthlyIncome.toLocaleString('en-IN')}
- Monthly Expenses: ₹${this.financialData.monthlyExpenses.toLocaleString('en-IN')}
- Total Investments: ₹${this.financialData.investments.toLocaleString('en-IN')}
- Net Savings: ₹${this.financialData.savings.toLocaleString('en-IN')}
- Savings Rate: 62%
- Debt-to-Income Ratio: 18%

Financial Goals:
${this.financialData.goals.map((goal) => `- ${goal.name}: ₹${goal.current.toLocaleString('en-IN')} / ₹${goal.target.toLocaleString('en-IN')} (${Math.round(goal.current / goal.target * 100)}% complete)`).join('\n')}

Monthly Expense Breakdown:
${Object.entries(this.financialData.expenses).map(([category, amount]) => `- ${category.charAt(0).toUpperCase() + category.slice(1)}: ₹${amount.toLocaleString('en-IN')}`).join('\n')}

User Question: ${userMessage}
`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: context
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json() as { content?: Array<{ text?: string }> };
      return data.content?.[0]?.text ?? this.getFallbackResponse(userMessage);
    } catch {
      return this.getFallbackResponse(userMessage);
    }
  }

  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      return "Based on your excellent 62% savings rate, you're already doing great! To optimize further, I recommend:\n\n1. Automate your savings by setting up auto-transfers right after salary credit\n2. Consider increasing your SIP contributions by ₹5,000/month to reach your goals faster\n3. Review your ₹12,000 entertainment budget - even saving 30% here would add ₹43,200 annually to your goals\n\nYour current trajectory shows you'll reach your house down payment goal 4 months early. Keep up the excellent work!";
    }

    if (lowerMessage.includes('tax')) {
      return "Great question! Here are your top tax optimization opportunities:\n\n1. You can save ₹46,800 in taxes by investing ₹1.5L in ELSS mutual funds under Section 80C before March 31st\n2. Consider opening a PPF account for an additional ₹1.5L tax deduction\n3. Claim ₹25,000 under Section 80D for health insurance for yourself and ₹50,000 for parents\n4. Your current NPS contributions can provide extra ₹50,000 deduction under Section 80CCD(1B)\n\nTotal potential tax savings: ₹78,000+ annually!";
    }

    if (lowerMessage.includes('invest')) {
      return "Based on your portfolio and risk profile, here's my recommendation:\n\n1. Your current portfolio is performing well with 18% returns. However, I suggest adding 15% international equity exposure for better diversification\n2. Consider splitting new investments: 50% in Index Funds (Nifty 50/Nifty Next 50), 30% in ELSS for tax benefits, 20% in international funds\n3. Your ₹60,000 monthly SIP across all goals is excellent. Consider auto-increasing it by 10% annually\n\nWith your current investment rate and 12% expected returns, you'll build a corpus of ₹2.8 crore in 15 years!";
    }

    if (lowerMessage.includes('goal') || lowerMessage.includes('house')) {
      return "Let me analyze your goals:\n\nHouse Down Payment (65% complete): You're on track to complete this 4 months early. At your current ₹25,000/month pace, you'll have ₹20L by October 2026.\n\nChild's Education (42% complete): Slightly behind schedule. I recommend increasing your monthly contribution from ₹15,000 to ₹18,000 to stay on track.\n\nRetirement (28% complete): You're building well for the long term. Your ₹20,000/month SIP at 12% returns will grow to ₹2.8 crore by age 60.\n\nOverall, you're doing excellent. Small adjustments will ensure you hit all targets comfortably.";
    }

    if (lowerMessage.includes('spending') || lowerMessage.includes('expense')) {
      return "Let me break down your spending patterns:\n\nYour total monthly expenses of ₹3.25L are very well-controlled given your income. Here's what stands out:\n\nStrengths: Housing at 38% of expenses is reasonable, and utilities are well-managed.\nOptimization Areas: Entertainment (₹12,000) could be reduced by 25% and food & dining (₹25,000) has room for 20% optimization.\n\nThese small cuts would increase your annual savings by about ₹96,000 without impacting your lifestyle significantly.";
    }

    return "I'm your AI financial advisor, and I'm here to help with tax optimization, investment recommendations, expense analysis, goal tracking, retirement planning, and debt management. What specific aspect of your finances would you like to discuss?";
  }

  private async generateFinancialPlan(): Promise<void> {
    const planContent = document.getElementById('planContent');
    if (!planContent) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    planContent.innerHTML = `
      <div class="space-y-8">
        <div class="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl">
          <h3 class="text-2xl font-bold gradient-text mb-4">Executive Summary</h3>
          <p class="text-gray-700 leading-relaxed">Based on your financial profile, you're in an excellent position with a 62% savings rate and ₹5.25L in net monthly savings. Your investments are growing at 18% annually, and you're on track to achieve most of your goals ahead of schedule.</p>
        </div>
        <div class="text-center pt-4">
          <button class="btn-primary px-8 py-3" onclick="closeFinancialPlanModal()">
            Got It! Let's Start
          </button>
        </div>
      </div>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

}
