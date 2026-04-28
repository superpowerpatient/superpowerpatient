// 스크린샷 전용 Tailwind 설정. index.html의 tailwind.config 객체와 동일한 테마.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        primary: '#E91E8C',
        secondary: '#6C63FF',
        softbg: '#FFF8FC',
        textmain: '#2D1B3D',
        textsub: '#6B7280',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Apple SD Gothic Neo',
               'Noto Sans KR', 'Pretendard', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 20px rgba(233, 30, 140, 0.08)',
      },
    },
  },
};
