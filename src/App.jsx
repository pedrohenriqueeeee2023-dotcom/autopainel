import { lazy, useEffect, useRef } from 'react';
import { initReveal } from './reveal';
import { initSmoothScroll } from './smoothScroll';
import { initPointerFx } from './pointerFx';
import { initAnalytics } from './analytics';
import Defer from './Defer';
import PhotoBand from './PhotoBand';
import Header from './sections/Header';
import Opening from './sections/Opening';

// Cada seção abaixo da abertura é um pedaço separado: código e CSS só baixam
// quando a seção chega perto da tela.
const Solved = lazy(() => import('./sections/Solved'));
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
        <div className="band-light">
          <Defer id="resolvemos" height="130vh">
            <Solved />
          </Defer>
        </div>
        <Defer id="app" height="120vh">
          <AppDemo />
        </Defer>
        <div className="band-light">
          <Defer id="comparativo" height="90vh">
            <Compare />
          </Defer>
        </div>
        <Defer id="prova" height="110vh">
          <Proof />
        </Defer>
        <PhotoBand>
          <Defer id="planos" height="110vh">
            <Offer />
          </Defer>
        </PhotoBand>
        <div className="band-light">
          <Defer id="duvidas" height="90vh">
            <Faq />
          </Defer>
        </div>
      </main>
    </div>
  );
}
