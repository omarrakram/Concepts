import { useEffect } from 'react';
import { Hero } from './Hero';
import { Philosophy } from './Philosophy';
import { Horizon } from './Horizon';
import { Escape } from './Escape';
import { Departments } from './Departments';
import { Atlas } from './Atlas';
import { Materials } from './Materials';
import { Edit } from './Edit';
import { Builder } from './Builder';
import { Journal } from './Journal';
import { Finale } from './Finale';

export function Home() {
  useEffect(() => {
    document.title = 'KAI — The Art of Escape · Unofficial concept';
  }, []);
  return (
    <div className="home">
      <Hero />
      <Philosophy />
      <Horizon />
      <Escape />
      <Departments />
      <Atlas />
      <Materials />
      <Edit />
      <Builder />
      <Journal />
      <Finale />
    </div>
  );
}
