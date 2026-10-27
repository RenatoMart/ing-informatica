import React from 'react';
import { motion } from 'framer-motion';

export function Loader({ fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className="w-12 h-12 border-4 border-slate-50 border-t-primary rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <span className="text-primary font-semibold font-body animate-pulse">Cargando...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999] bg-white flex items-center justify-center">{content}</div>
    );
  }

  return <div className="py-8 flex justify-center w-full">{content}</div>;
}