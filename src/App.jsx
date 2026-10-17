import { lazy, useEffect, useRef } from 'react';
import { initReveal } from './reveal';
import { initSmoothScroll } from './smoothScroll';
import { initPointerFx } from './pointerFx';
import { initAnalytics } from './analytics';
import Defer from './Defer';
import Header from './sections/Header';
import Opening from './sections/Opening';

// Cada seção abaixo da abertura é um pedaço separado: código e CSS só baixam
// quando a seção chega perto da tela.
const Solved = lazy(() => import('./sections/Solved'));
const BeforeAfter = lazy(() => import('./sections/BeforeAfter'));
const AppDemo = lazy(() => import('./sections/AppDemo'));
const Compare = lazy(() => import('./sections/Compare'));
const Proof = lazy(() => import('./sections/Proof'));
const Offer = lazy(() => import('./sections/Offer'));
const Faq = lazy(() => import('./sections/Faq'));

export default function App() {
  const ref = useRef(null);
  useEffect(() => initReveal(ref.current), []);
  useEffect(() => initSmoothScroll(), []);
  useEffect(() => initPointerFx(ref.current), []);
  useEffect(() => initAnalytics(), []);

  return (
    <div className="ap" ref={ref}>
      <a className="ap-skip" href="#planos">
        Pular para planos
      </a>
      <Header />
      <main>
        <Opening />
        <Defer id="resolvemos" height="130vh">
          <Solved />
        </Defer>
        <Defer id="como" height="80vh">
          <BeforeAfter />
        </Defer>
        <Defer id="app" height="120vh">
          <AppDemo />
        </Defer>
        <Defer id="comparativo" height="90vh">
          <Compare />
        </Defer>
        <Defer id="prova" height="110vh">
          <Proof />
        </Defer>
        <Defer id="planos" height="110vh">
          <Offer />
        </Defer>
        <Defer id="duvidas" height="90vh">
          <Faq />
        </Defer>
      </main>
    </div>
  );
}
