import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatRequest } from '../../services/chat.service';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-tpchat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tpchat.html',
  styleUrls: ['./tpchat.scss']
})
export class TpchatComponent {

  messages: Message[] = [
    { role: 'ai', text: 'Hi! Gib mir deinen RPE (1–10) und beschreib kurz dein Training.' }
  ];

  userInput: string = '';
  selectedRPE: number | null = null;

  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(private chatService: ChatService) {}

  selectRPE(rpe: number): void {
    this.selectedRPE = rpe;
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text) return;

    this.errorMessage = null;
    this.messages.push({ role: 'user', text });

    const payload: ChatRequest = {
      message: text,
      rpe: this.selectedRPE
    };

    this.userInput = '';
    this.isLoading = true;

    this.chatService.sendMessage(payload).subscribe({
      next: (res) => {
        this.messages.push({ role: 'ai', text: res.answer ?? '(keine Antwort)' });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Chat Fehler:', err);
        this.errorMessage = 'Backend nicht erreichbar oder Fehler beim Request.';
        this.isLoading = false;
        this.messages.push({
          role: 'ai',
          text: 'Ich konnte das Backend gerade nicht erreichen. Bitte später nochmal versuchen.'
        });
      }
    });
  }
}
