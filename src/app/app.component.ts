
import { Component, ElementRef, OnInit, ViewChild,Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HashTableService }  from  './HashTableService'
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [HashTableService],
})
export class AppComponent implements OnInit {

  title = 'HashTable';
  newWord: string = '';
  searchResult: boolean | null = null;
  table: any = null;
  @ViewChild('canvas', {static: true}) canvas?: ElementRef<HTMLCanvasElement>;
  colorPalette: string[] = ['#348888', '#22BABB', '#9EF8EE', '#FA7F08', '#F24405'];

  constructor(private hashTableService: HashTableService,
              @Inject(PLATFORM_ID) private platformId: Object) {
  }

  ngOnInit(): void {
    this.refreshTable();
  }

  addWord(): void {
    if (this.newWord.trim() !== '') {
      this.hashTableService.addWord(this.newWord.trim()).subscribe(() => {
        console.log(`Word added: ${this.newWord}`);
        this.drawRect();
        this.newWord = '';
        this.refreshTable();
      });
    }
  }

  removeWord(): void {
    if (this.newWord.trim() !== '') {
      this.hashTableService.removeWord(this.newWord.trim()).subscribe(() => {
        console.log(`Word removed: ${this.newWord}`);

        this.newWord = '';
        this.refreshTable();
      });
    }
  }

  searchWord(): void {
    if (this.newWord.trim() !== '') {
      this.hashTableService.searchWord(this.newWord.trim()).subscribe((result: boolean | null) => {
        this.searchResult = result;
        console.log(`Search result for ${this.newWord}: ${this.searchResult}`);
      });
    } else {
      this.searchResult = null;
    }
  }

  resetSearchResult(): void {
    this.searchResult = null;
  }

  refreshTable(): void {
    this.hashTableService.getTable().subscribe((table: any[]) => {
      this.table = table;
      this.table = table.sort((a: any, b: any) => a.index - b.index);
      this.drawRect();
    });
  }

  drawRect(): void {
    if (isPlatformBrowser(this.platformId)) {
      const canvas = this.canvas?.nativeElement;
      if (!canvas || !this.table) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cellWidth = 100;
      const cellHeight = 30;
      const padding = 10;
      const borderRadius = 5;

      this.table.forEach((row: any, i: number) => {
        const indexX = padding;
        const indexY = padding + i * (cellHeight + padding);
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(indexX, indexY, cellWidth, cellHeight);

        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(row.index.toString(), indexX + cellWidth / 2, indexY + cellHeight / 2);

        let current = row.firstCell;
        let j = 0;
        while (current !== null) {
          const x = padding + (j + 1) * (cellWidth + padding);
          const y = padding + i * (cellHeight + padding);

          const word = current.data;

          ctx.fillStyle = this.colorPalette[i % this.colorPalette.length];
          ctx.strokeStyle = this.colorPalette[i % this.colorPalette.length];
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + borderRadius, y);
          ctx.lineTo(x + cellWidth - borderRadius, y);
          ctx.quadraticCurveTo(x + cellWidth, y, x + cellWidth, y + borderRadius);
          ctx.lineTo(x + cellWidth, y + cellHeight - borderRadius);
          ctx.quadraticCurveTo(x + cellWidth, y + cellHeight, x + cellWidth - borderRadius, y + cellHeight);
          ctx.lineTo(x + borderRadius, y + cellHeight);
          ctx.quadraticCurveTo(x, y + cellHeight, x, y + cellHeight - borderRadius);
          ctx.lineTo(x, y + borderRadius);
          ctx.quadraticCurveTo(x, y, x + borderRadius, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#000000';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(word, x + cellWidth / 2, y + cellHeight / 2);

          current = current.next;
          j++;
        }
      });
    }
  }
}
