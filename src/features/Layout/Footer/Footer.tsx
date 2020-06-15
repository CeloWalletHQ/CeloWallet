import React from 'react';

import { DonateAndSubscribe, Linkset, SocialsAndLegal } from './components';
import './Footer.scss';

const HorizontalRule = () => (
  <section className="HorizontalRule">
    <section className="HorizontalRule-line" />
  </section>
);

const VerticalRule = () => (
  <section className="VerticalRule">
    <section className="VerticalRule-line" />
  </section>
);
// @todo - logoBox
const MobileFooter = () => (
  <section className="mobile-only">
    <section className="Footer">
      {/* <LogoBox /> */}
      <HorizontalRule />
      <DonateAndSubscribe />
      <HorizontalRule />
      <Linkset />
      <SocialsAndLegal />
    </section>
  </section>
);
// @todo - logoBox
const TabletFooter = () => (
  <section className="tablet-only">
    <section className="Footer">
      {/* <LogoBox /> */}
      <VerticalRule />
      <section style={{ display: 'flex', flexDirection: 'column', flex: 5 }}>
        <Linkset />
        <DonateAndSubscribe />
      </section>
    </section>
  </section>
);
// @todo - logoBox
const DesktopFooter = () => (
  <section className="desktop-only">
    <section className="NewFooter-wrapper">
      <section className="Footer">
        {/* <LogoBox /> */}
        <VerticalRule />
        <Linkset />
        <VerticalRule />
        <DonateAndSubscribe />
      </section>
    </section>
  </section>
);

export default function Footer() {
  return (
    <>
      <MobileFooter />
      <TabletFooter />
      <DesktopFooter />
    </>
  );
}
