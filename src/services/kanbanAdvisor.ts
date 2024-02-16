import axios from 'axios';
import { KanbanStage } from '../types/kanbanStage';

export class KanbanAdvisor {
    private openAiApiKey: string;
  
    constructor(openAiApiKey: string) {
      this.openAiApiKey = openAiApiKey;
    }
  
    private async callOpenAiApi(prompt: string): Promise<string> {

      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            "model": "gpt-3.5-turbo-0125",
            "response_format": { "type": "json_object" },
            "messages": [
              {
                "role": "system",
                "content": "You are a helpful assistant designed providing advice for a kanban board. Provide only one recommendation to improve the managment of kanban board. The output JSON should contain just ONE reccomendation following this format { 'response': 'XX' }. Consider in your recomendations the content, the color and the number of dots inside each note. Determine from the text what the number of points means (estimated effort, complexity, risk or value)."
              },
              {
                "role": "user",
                "content": prompt
              }
            ]
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openAiApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
  
        return response.data.choices[0].message.content.trim();
      } catch (error) {
        console.error('Error calling OpenAI API:', error);
        throw new Error('Failed to get recommendations from OpenAI.');
      }
    }
  
    public async getProductivityRecommendations(kanbanStages: KanbanStage[]): Promise<string> {

       console.log(kanbanStages);
      const prompt = this.generatePrompt(kanbanStages);

      return await this.callOpenAiApi(prompt);
    }
  
    private generatePrompt(kanbanStages: KanbanStage[]): string {
      let prompt = 'Based on the following Kanban board content, provide productivity recommendations and suggested actions:\n\n';
  
        console.log('ddd' + kanbanStages);

      kanbanStages.forEach(stage => {
        prompt += `Stage "${stage.name}" contains:\n`;
        stage.notes.forEach(note => {
          prompt += `- ${note.text} color: ${note.color}) dots: ${note.dots})\n`;  
        });
      });

      console.log(prompt);
  
      return prompt;
    }
  }