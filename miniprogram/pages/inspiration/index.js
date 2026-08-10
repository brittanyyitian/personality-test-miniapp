const { inspirationCards } = require('../../data/assessments');

function dayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function hash(text) {
  let value = 0;
  for (let index = 0; index < text.length; index += 1) value = (value * 31 + text.charCodeAt(index)) >>> 0;
  return value;
}

Page({
  data: {
    choices: Object.keys(inspirationCards).map((key) => ({ key, title: inspirationCards[key].title })),
    selected: '',
    card: null,
    note: '',
    saved: false,
    redrawUsed: false
  },

  choose(event) {
    this.setData({ selected: event.currentTarget.dataset.key });
  },

  draw() {
    if (!this.data.selected) return;
    const group = inspirationCards[this.data.selected];
    const redraw = this.data.card ? 1 : 0;
    if (redraw && this.data.redrawUsed) {
      wx.showToast({ title: '今天已经重抽过一次了', icon: 'none' });
      return;
    }
    const index = hash(`${dayKey()}_${this.data.selected}_${redraw}`) % group.cards.length;
    this.setData({ card: group.cards[index], redrawUsed: Boolean(redraw), note: '', saved: false });
  },

  updateNote(event) {
    this.setData({ note: event.detail.value, saved: false });
  },

  saveNote() {
    if (!this.data.card) return;
    const key = 'mind_inspiration_notes_v1';
    const notes = wx.getStorageSync(key) || [];
    notes.unshift({ cardId: this.data.card.id, note: this.data.note, createdAt: new Date().toISOString() });
    wx.setStorageSync(key, notes.slice(0, 100));
    this.setData({ saved: true });
    wx.showToast({ title: '已保存在本机', icon: 'success' });
  }
});
