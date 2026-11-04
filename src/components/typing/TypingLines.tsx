'use client'

import React from 'react'

/** 练习册四线三格跟打区：无外框，字母紧凑排版，光标贴合输入末尾 */
export function TypingLines({
  target,
  currentInput,
  hasTypo,
}: {
  target: string
  currentInput: string
  hasTypo: boolean
}) {
  const totalSlots = Math.max(target.length, currentInput.length)
  const fontClass =
    totalSlots <= 6
      ? 'text-4xl sm:text-5xl xl:text-6xl'
      : totalSlots <= 9
        ? 'text-3xl sm:text-4xl xl:text-5xl'
        : 'text-2xl sm:text-3xl xl:text-4xl'
  const lineClass = hasTypo ? 'border-destructive/50' : 'border-foreground/15'
  const softLineClass = hasTypo ? 'border-destructive/30' : 'border-foreground/10'

  return (
    <div
      className={`relative mx-auto mt-3 xl:mt-4 w-full max-w-xl h-16 sm:h-18 xl:h-20 flex items-center justify-center font-mono ${
        hasTypo ? 'animate-shake' : ''
      }`}
    >
      <div className="absolute inset-x-0 inset-y-1.5 pointer-events-none flex flex-col justify-between z-0">
        <div className={`w-full border-b ${lineClass}`} />
        <div className={`w-full border-b border-dashed ${softLineClass}`} />
        <div className={`w-full border-b ${lineClass}`} />
        <div className={`w-full border-b ${softLineClass}`} />
      </div>

      <div className={`relative z-10 inline-flex items-center justify-center h-full font-mono ${fontClass}`}>
        {Array.from({ length: totalSlots }).map((_, idx) => {
          const targetChar = target[idx]
          const typedChar = currentInput[idx]
          const isTyped = idx < currentInput.length
          const isCurrent = idx === currentInput.length
          const isCorrect =
            isTyped && targetChar && typedChar.toLowerCase() === targetChar.toLowerCase()

          return (
            <div
              key={idx}
              style={{ width: '1.05ch' }}
              className="relative w-[1.05ch] h-full flex items-center justify-center"
            >
              {isCurrent && (
                <span
                  className={`absolute left-0 top-2 bottom-5 w-0.5 animate-cursor ${
                    hasTypo ? 'bg-destructive' : 'bg-primary'
                  }`}
                />
              )}

              {isTyped && (
                <span
                  className={`${fontClass} -translate-y-1.5 sm:-translate-y-2 ${
                    isCorrect ? 'text-white' : 'text-destructive font-semibold animate-error-flash rounded'
                  }`}
                  title={!isCorrect ? '输入错误，请按退格键 (Backspace) 修正' : undefined}
                >
                  {typedChar}
                </span>
              )}

              {/* 未输入的占位短横：落在最下方的第 4 线上 */}
              <span
                className={`absolute bottom-1.5 left-[22%] right-[22%] h-0.5 rounded-full pointer-events-none transition-opacity ${
                  isTyped ? 'opacity-0' : hasTypo ? 'bg-destructive/40' : 'bg-foreground/25'
                }`}
              />
            </div>
          )
        })}

        {currentInput.length >= totalSlots && (
          <span
            className={`w-0.5 h-7 sm:h-9 xl:h-11 animate-cursor self-center -translate-y-1.5 ${
              hasTypo ? 'bg-destructive' : 'bg-primary'
            }`}
          />
        )}
      </div>
    </div>
  )
}
