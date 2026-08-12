"use client";

import { FormEvent, useRef, useState } from "react";
import gsap from "gsap";
import styles from "./CallsignForm.module.css";

interface CallsignFormProps {
  visible: boolean;
  onSubmit: (callsign: string) => Promise<void>;
}

export default function CallsignForm({ visible, onSubmit }: CallsignFormProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      if (formRef.current) {
        gsap
          .timeline()
          .to(formRef.current, { x: -8, duration: 0.06 })
          .to(formRef.current, { x: 8, duration: 0.06 })
          .to(formRef.current, { x: -6, duration: 0.06 })
          .to(formRef.current, { x: 0, duration: 0.06 });
        gsap.fromTo(
          formRef.current,
          { boxShadow: "0 0 0 2px rgba(200,29,37,0.9)" },
          { boxShadow: "0 0 0 0px rgba(200,29,37,0)", duration: 0.5 }
        );
      }
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      className={styles.form}
      data-visible={visible}
      onSubmit={handleSubmit}
    >
      <label className={styles.label} htmlFor="callsign">
        CALLSIGN
      </label>
      <div className={styles.inputRow}>
        <input
          id="callsign"
          className={styles.input}
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={value}
          disabled={submitting}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ENTER DESIGNATION"
        />
        <span className={styles.blinkCursor} aria-hidden="true">
          ▮
        </span>
      </div>
      <button type="submit" className={styles.submit} disabled={submitting}>
        {submitting ? "PROCESSING..." : "TRANSMIT →"}
      </button>
    </form>
  );
}
