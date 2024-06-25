// @ts-ignore
import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
// @ts-ignore
import { CommonModule } from '@angular/common';
// @ts-ignore
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class AppComponent implements AfterViewInit {
  private table: Map<string, string[]> = new Map();
  private count: number = 0;
  private tableSize: number = 10;
  public inputKey: string = '';
  public tableEntries: { index: string; values: string[] }[] = [];
  public size: number = 0;
  public containsResult: string = '';
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  private readonly boxWidth: number = 100;
  private readonly boxHeight: number = 30;
  private readonly boxSpacing: number = 5;

  private animatingKey: string | null = null;
  private animatingChainPosition: number = -1;
  private animationStep: number = 0;
  private currentX: number = 0;
  private currentY: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private movingToIndex: boolean = true;
  private readonly ANIMATION_STEPS: number = 20;

  constructor() {
    for (let i = 0; i < this.tableSize; i++) {
      this.table.set(i.toString(), []);
    }
    this.updateTableEntries();
  }

  ngAfterViewInit() {
    const canvas = this.canvasElement.nativeElement;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.drawInitialTable();
  }

  private hashFunction(key: string): number {
    let hashValue = 0;
    const n = key.length;
    for (let i = 0; i < n; i++) {
      hashValue = (hashValue + key.charCodeAt(i)) * 31;
    }
    return Math.abs(hashValue % this.tableSize);
  }

  add(key: string): void {
    const index = this.hashFunction(key).toString();
    const list = this.table.get(index) || [];

    if (!list.includes(key)) {
      this.startAnimation(key, parseInt(index));
      this.count++;
      console.log(`Added ${key}`);
    } else {
      alert(`Name already exists: ${key}`)
    }
  }

  remove(key: string): void {
    const index = this.hashFunction(key).toString();
    const list = this.table.get(index);

    if (list) {
      const lastIndex = list.lastIndexOf(key);
      if (lastIndex !== -1) {
        list.splice(lastIndex, 1);
        this.count--;
        this.updateTableEntries();
        this.redrawCanvas();
      } else {
        alert(`Name Not Found: ${key}`)
      }
    }
  }

  getHashTableSize(): number {
    return this.count;
  }

  contains(key: string): boolean {
    const index = this.hashFunction(key).toString();
    const list = this.table.get(index);

    return !!(list && list.includes(key));
  }

  private updateTableEntries(): void {
    this.tableEntries = [];
    for (let i = 0; i < this.tableSize; i++) {
      const index = i.toString();
      const values = this.table.get(index) || [];
      this.tableEntries.push({index, values});
    }
  }

  updateSize(): void {
    this.size = this.getHashTableSize();
  }

  updateContains(key: string): void {
    this.containsResult = this.contains(key) ? 'Yes' : 'No';
  }


  private drawInitialTable(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    for (let i = 0; i < this.tableSize; i++) {
      const y = (this.boxHeight + this.boxSpacing) * i;
      this.ctx.strokeRect(0, y, this.boxWidth, this.boxHeight);
      this.ctx.fillText(i.toString(), 5, y + 15);
    }
  }

  private startAnimation(key: string, index: number): void {
    this.animatingKey = key;
    this.animatingChainPosition = (this.table.get(index.toString()) || []).length;
    this.animationStep = 0;

    const cellHeight = this.boxHeight;
    const padding = this.boxSpacing;
    const cellWidth = this.boxWidth;

    this.currentX = padding;
    this.currentY = -cellHeight;
    this.targetX = padding + (cellWidth + padding);
    this.targetY = index * (cellHeight + padding) + padding;
    this.movingToIndex = true;

    const animate = () => {
      if (this.animationStep < this.ANIMATION_STEPS) {
        this.currentX += (this.targetX - this.currentX) / (this.ANIMATION_STEPS - this.animationStep + 1);
        this.currentY += (this.targetY - this.currentY) / (this.ANIMATION_STEPS - this.animationStep + 1);
      } else {
        if (this.movingToIndex) {
          this.movingToIndex = false;
          this.animationStep = 0;
          this.targetX = padding + (cellWidth + padding) * (this.animatingChainPosition + 1);
        } else {
          this.currentX += (this.targetX - this.currentX) / (this.ANIMATION_STEPS - this.animationStep + 1);
          if (this.animationStep >= this.ANIMATION_STEPS) {
            this.table.get(index.toString())?.push(this.animatingKey as string);
            this.animatingKey = null;
            this.updateTableEntries();
            this.redrawCanvas();
            return;
          }
        }
      }

      this.animationStep++;
      this.redrawCanvas();
      if (this.animatingKey) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  private redrawCanvas(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.drawInitialTable();
    for (let i = 0; i < this.tableSize; i++) {
      const index = i.toString();
      const values = this.table.get(index) || [];
      values.forEach((value, j) => {
        const x = this.boxWidth + this.boxSpacing + j * (this.boxWidth + this.boxSpacing);
        const y = (this.boxHeight + this.boxSpacing) * i;
        this.ctx.strokeRect(x, y, this.boxWidth, this.boxHeight);
        this.ctx.fillText(value, x + 5, y + 15);

        if (j > 0) {
          this.ctx.beginPath();
          this.ctx.moveTo(x - this.boxSpacing, y + this.boxHeight / 2);
          this.ctx.lineTo(x, y + this.boxHeight / 2);
          this.ctx.stroke();
        }
      });

      if (values.length > 0) {
        const x = this.boxWidth + this.boxSpacing + values.length * (this.boxWidth + this.boxSpacing);
        const y = (this.boxHeight + this.boxSpacing) * i;
        this.ctx.beginPath();
        this.ctx.moveTo(x - this.boxSpacing, y + this.boxHeight / 2);
        this.ctx.lineTo(x, y + this.boxHeight / 2);
        this.ctx.stroke();
        this.ctx.moveTo(x, y + this.boxSpacing);
        this.ctx.lineTo(x, y + this.boxHeight - this.boxSpacing);
        this.ctx.stroke();

        const dashLength = 8;
        const dashSpacing = 5;
        for (let dashY = y + this.boxSpacing - 1; dashY < y + this.boxHeight - this.boxSpacing; dashY += dashSpacing) {
          this.ctx.beginPath();
          this.ctx.moveTo(x, dashY + dashLength);
          this.ctx.lineTo(x + dashLength, dashY - dashLength);
          this.ctx.stroke();
        }
      }
    }

    if (this.animatingKey) {
      this.ctx.fillStyle = 'black';
      this.ctx.fillText(this.animatingKey, this.currentX + 5, this.currentY + 15);
    }
  }
}
