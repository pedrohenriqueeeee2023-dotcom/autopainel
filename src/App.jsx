import { useEffect, useRef } from 'react';
import { initScrollEngine } from './scrollEngine';
import Header from './sections/Header';
import Opening from './sections/Opening';
import Publishing from './sections/Publishing';
import Crm from './sections/Crm';
import Calculator from './sections/Calculator';
import Operation from './sections/Operation';
import Offer from './sections/Offer';
import Footer from './sections/Footer';

export default function App() {
  const ref = useRef(null);
  useEffect(() => initScrollEngine(ref.current), []);

  return (
    <div className="ap" ref={ref}>
      <a className="ap-skip" href="#planos">
        Pular para planos
      </a>
      <Header />
      <main>
        <Opening />
        <Publishing />
        <Crm />
        <Calculator />
        <Operation />
        <Offer />
      </main>
      <Footer />
    </div>
  );
}
