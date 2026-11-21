import { afterEach, describe, expect, it } from 'vitest';
import { MATERIAL_SHAPE_SVG } from '../../src/shapes/index.js';
import { AVATAR_SRC, mountHomeAbout } from '../../playground/home-about/mount.js';

const HOST_HTML = `
<section id="home-about" class="home-about" data-home-about>
  <div class="home-about__grid">
    <figure class="home-about__portrait">
      <div class="home-about__frame"></div>
      <figcaption class="home-about__caption">
        <span class="home-about__name">Kam3leoN</span>
        <span class="home-about__role" data-i18n="playground.home.about.role">Creator and lead developer</span>
      </figcaption>
    </figure>
    <div class="home-about__copy">
      <h2 id="home-about-title" data-i18n="playground.home.about.title">Behind k3ui</h2>
      <a class="home-about__profile" href="https://github.com/Kam3leoN">
        <span class="home-about__profile-av"><img src="/old.gif" alt="" /></span>
        GitHub
      </a>
      <a class="home-about__support" href="#/sponsors">Support</a>
    </div>
  </div>
</section>`;

describe('home-about', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses the local GIF avatar with a spinning Cookie clip', () => {
    document.body.innerHTML = HOST_HTML;
    mountHomeAbout();
    expect(
      document.querySelector('#home-about-cookie path')?.getAttribute('d'),
    ).toBe(MATERIAL_SHAPE_SVG.Cookie12Sided);
    expect(
      document.querySelector('#home-about-flower path')?.getAttribute('d'),
    ).toBe(MATERIAL_SHAPE_SVG.Flower);
    const spinClip = document.querySelector('.home-about__spin-clip');
    expect(spinClip?.getAttribute('d')).toBe(MATERIAL_SHAPE_SVG.Cookie12Sided);
    const photo = document.querySelector('.home-about__photo') as HTMLImageElement;
    expect(photo.src).toContain(AVATAR_SRC);
    expect(
      (document.querySelector('.home-about__profile-av img') as HTMLImageElement).src,
    ).toContain(AVATAR_SRC);
  });

  it('is idempotent when mounted twice', () => {
    document.body.innerHTML = HOST_HTML;
    mountHomeAbout();
    mountHomeAbout();
    expect(document.querySelectorAll('svg.home-about__defs')).toHaveLength(1);
    expect(document.querySelectorAll('.home-about__photo')).toHaveLength(1);
  });
});
