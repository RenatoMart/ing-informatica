import React from 'react';

export default function FloatingSocials() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 transform-gpu will-change-transform">
      {/* Facebook */}
      <a
        href="https://facebook.com"
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 bg-[#1877F2] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition duration-300 group"
        aria-label="Facebook"
      >
        <svg
          className="w-6 h-6 fill-current"
          viewBox="0 0 24 24"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>

      {/* TikTok */}
      <a
        href="https://tiktok.com"
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl transition duration-300 relative overflow-hidden group"
        aria-label="TikTok"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#00f2fe] via-black to-[#fe0979] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <svg
          className="w-6 h-6 fill-current relative z-10"
          viewBox="0 0 24 24"
        >
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z" />
        </svg>
      </a>
    </div>
  );
}
