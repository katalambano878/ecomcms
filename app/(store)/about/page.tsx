'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCMS } from '@/context/CMSContext';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function AboutPage() {
  usePageTitle('Our Story');
  const { getSetting } = useCMS();
  const [activeTab, setActiveTab] = useState('story');

  const siteName = getSetting('site_name') || 'Queensprettydolls Fashion';

  // Hardcoded brand content
  const heroTitle = 'The Story of Queensprettydolls Fashion';
  const heroSubtitle = 'It began with a simple dream — to make ends meet.';
  const storyTitle = 'From a Single Dress to the World';
  const storyImage = '/images/queen.png';
  const founderName = 'Queen';
  const founderTitle = 'Founder & CEO';
  const mission1Title = 'Our Mission';
  const mission1Content =
    'To help people look beautiful, feel confident, and proudly say, “I got this from Queensprettydolls Fashion.” What was once a business became a passion — dressing people across the world and standing behind every piece we sell.';
  const mission2Title = 'Our Vision';
  const mission2Content =
    'From Ghana to Togo, from Nigeria to China, we are taking steps toward manufacturing and producing our own original designs for customers everywhere — building a brand that crosses borders and reaches new heights.';
  const valuesTitle = 'What This Journey Taught Us';

  const storyParagraphs = [
    'Queen was just a young lady trying to make ends meet. She wasn’t thinking about supplying the world. She simply wanted to sell dresses to feed.',
    'The journey started in Accra’s Makola Market, where she bought clothes from wholesalers and sold them to customers one piece at a time. As her passion grew, she began traveling to Togo, purchasing just two, three, or four pieces at a time for her customers.',
    'She had no guarantees — only faith and hard work. Faith that one day the small brand she was building would become something greater.',
    'What started with a few pieces slowly grew into hundreds. Hundreds became thousands. Within a few years, Queensprettydolls Fashion had grown from selling single pieces to moving hundreds, thousands, and eventually tens of thousands of pieces.',
    'Seven years later, the journey continues. The business that started on the streets of Accra expanded beyond Ghana — moving from importing clothes from Togo to establishing operations in Nigeria, where original designs began to take shape.',
    'Today, the same brand that started in Makola Market has crossed borders and reached new heights. From Ghana to Togo, from Nigeria to China, Queen’s Pretty Dolls Fashion is now taking steps toward manufacturing and producing its own designs for customers across the world.',
  ];

  return (
    <div className="bg-white min-h-screen text-black selection:bg-black selection:text-white">

      {/* Editorial Hero */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gray-100 z-0">
          <img src="https://images.unsplash.com/photo-1620331317312-74b88bf40907?q=80&w=2669&auto=format&fit=crop"
            alt="Luxury hair background"
            className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-white/40"></div>
        </div>

        <div className="relative z-10 text-center max-w-4xl px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <span className="block text-xs font-bold uppercase tracking-[0.2em] mb-4 text-gray-800">About {siteName}</span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl font-light text-gray-700 max-w-2xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>
        </div>
      </section>

      {/* Navigation / Intro */}
      <div className="border-b border-gray-100 sticky top-16 md:top-20 bg-white/95 backdrop-blur-md z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-center gap-12 py-6">
          <button
            onClick={() => setActiveTab('story')}
            className={`text-sm uppercase tracking-widest transition-all ${activeTab === 'story'
              ? 'font-bold text-black border-b border-black pb-1'
              : 'text-gray-400 hover:text-black'
              }`}
          >
            Our Story
          </button>
          <button
            onClick={() => setActiveTab('mission')}
            className={`text-sm uppercase tracking-widest transition-all ${activeTab === 'mission'
              ? 'font-bold text-black border-b border-black pb-1'
              : 'text-gray-400 hover:text-black'
              }`}
          >
            Vision & Mission
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-32 transition-all duration-700 min-h-[600px]">
        {activeTab === 'story' && (
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="order-2 lg:order-1">
              <h2 className="font-serif text-4xl lg:text-5xl mb-8 leading-tight">{storyTitle}</h2>
              <div className="space-y-6 text-gray-600 font-light leading-relaxed text-lg">
                {storyParagraphs.map((p: string, i: number) => <p key={i}>{p}</p>)}
              </div>

              <div className="mt-12 flex items-center gap-4">
                <div className="h-px w-12 bg-black"></div>
                <div>
                  <p className="font-serif text-xl italic">{founderName}</p>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">{founderTitle}</p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="aspect-[4/5] bg-gray-100 overflow-hidden relative group">
                <img
                  src={storyImage}
                  alt={founderName}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Minimalist Border Frame */}
                <div className="absolute inset-4 border border-white/30 z-10 pointer-events-none"></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mission' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
              <div className="space-y-6">
                <div className="w-12 h-12 border border-gray-200 flex items-center justify-center rounded-full mb-6">
                  <span className="font-serif text-xl italic">01</span>
                </div>
                <h3 className="font-serif text-3xl">{mission1Title}</h3>
                <p className="text-gray-600 font-light leading-relaxed">
                  {mission1Content || 'We believe in going purely to the source. By visiting manufacturers directly, we eliminate middlemen who inflate prices. This hands-on approach guarantees that you align with the highest quality standards.'}
                </p>
              </div>

              <div className="space-y-6 md:mt-24">
                <div className="w-12 h-12 border border-black text-white bg-black flex items-center justify-center rounded-full mb-6">
                  <span className="font-serif text-xl italic">02</span>
                </div>
                <h3 className="font-serif text-3xl">{mission2Title}</h3>
                <p className="text-gray-600 font-light leading-relaxed">
                  {mission2Content || 'True luxury should be accessible. Our mission is to democratize access to premium hair. Whether for daily wear or special occasions, we believe everyone deserves to feel their absolute best.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Philosophy / Values - Parallax-like */}
      <section className="bg-black text-white py-32 px-4 sm:px-6 relative overflow-hidden">
        {/* Background pattern or subtle texture could go here */}
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-8">{valuesTitle}</span>
          <div className="grid md:grid-cols-3 gap-12 lg:gap-24 w-full">
            {[
              { title: 'Consistency', desc: 'Great things are built one step at a time.' },
              { title: 'Vision', desc: 'Believing in a dream before anyone else can see it.' },
              { title: 'Faith', desc: 'Foundations are laid brick by brick, with hard work.' },
            ].map((val, i) => (
              <div key={i} className="text-center group cursor-default">
                <h3 className="font-serif text-4xl mb-4 text-gray-300 group-hover:text-white transition-colors">{val.title}</h3>
                <div className="h-px w-12 bg-gray-800 mx-auto mb-4 group-hover:w-24 group-hover:bg-white transition-all duration-500"></div>
                <p className="text-gray-500 font-light group-hover:text-gray-300 transition-colors">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inspirational closing / manifesto */}
      <section className="relative py-28 lg:py-36 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <span className="block text-xs font-bold uppercase tracking-[0.2em] mb-8 text-gray-500">
            A Note to You
          </span>
          <p className="font-serif text-2xl md:text-3xl leading-relaxed text-black mb-10">
            If you are reading this today, know that this story is not about luck.
          </p>
          <div className="space-y-3 text-lg md:text-xl font-light text-gray-700 mb-12">
            <p>It is about consistency.</p>
            <p>It is about believing in a vision before anyone else can see it.</p>
            <p>It is about understanding that great things are built one step at a time.</p>
          </div>
          <p className="text-gray-600 font-light leading-relaxed max-w-2xl mx-auto mb-12">
            A building is not completed in a day. Its foundation is laid brick by brick. In the same way, every dream
            begins small before it becomes something extraordinary. So wherever you are in your journey, keep going.
            Start with what you have. Believe in your vision. Stay consistent.
          </p>
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px w-12 bg-black"></div>
            <p className="text-sm uppercase tracking-widest text-gray-500">
              One day, your story may inspire someone else
            </p>
            <div className="h-px w-12 bg-black"></div>
          </div>
          <p className="font-serif text-3xl md:text-4xl italic text-black">
            Welcome to the journey.
          </p>
          <p className="font-serif text-3xl md:text-4xl italic text-black mt-2">
            Welcome to {siteName}.
          </p>
        </div>
      </section>

      {/* Editorial CTA */}
      <section className="relative py-32 px-4 text-center bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-5xl md:text-6xl mb-8 text-black">Experience the Difference</h2>
          <Link
            href="/shop"
            className="inline-block border-b border-black pb-1 text-sm uppercase tracking-widest font-bold hover:text-gray-600 hover:border-gray-600 transition-colors"
          >
            Explore Collection
          </Link>
        </div>
      </section>
    </div>
  );
}
