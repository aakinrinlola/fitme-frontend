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

    // UI reset
    this.errorMessage = null;

    // 1) User message im Chat anzeigen
    this.messages.push({ role: 'user', text });

    // 2) Payload bauen
    const payload: ChatRequest = {
      message: text,
      rpe: this.selectedRPE
    };

    // 3) Input leeren + Loading setzen
    this.userInput = '';
    this.isLoading = true;

    // 4) POST ans Backend
    this.chatService.sendMessage(payload).subscribe({
      next: (res) => {
        this.messages.push({ role: 'ai', text: res.answer ?? '(keine Antwort)' });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Chat Fehler:', err);
        this.errorMessage = 'Backend nicht erreichbar oder Fehler beim Request.';
        this.isLoading = false;

        // Optional: Fehlermeldung auch als AI-Message anzeigen
        this.messages.push({
          role: 'ai',
          text: 'Ich konnte das Backend gerade nicht erreichen. Bitte später nochmal versuchen.'
        });
      }
    });
  }
}
