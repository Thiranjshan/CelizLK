'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function ContactPage() {
  const addToast = useStore((state) => state.addToast);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      addToast('error', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, orderNumber: orderNumber || null, message }),
      });
      if (res.ok) {
        addToast('success', 'Thank you! Your message has been sent successfully.');
        setName('');
        setEmail('');
        setOrderNumber('');
        setMessage('');
      } else {
        throw new Error('Failed to send message');
      }
    } catch {
      addToast('error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1.25rem 6rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-headline)' }}>Contact Us</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1.05rem' }}>
          Have questions? We are here to help you.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Contact Info */}
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-headline)', marginBottom: '1.5rem' }}>
            Get in touch
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.95rem' }}>
            We typically respond to messages within 24 hours. For urgent inquiries or delivery updates, please message us directly on WhatsApp for faster support.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                <Phone size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Phone</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-headline)' }}>+94 77 123 4567</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                <Mail size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Email</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-headline)' }}>support@celiz.lk</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Office</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-headline)' }}>Celiz LK, Galle Road, Colombo 03</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            <a 
              href="https://wa.me/94771234567" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-primary" 
              style={{ background: '#25D366', color: '#FFFFFF', boxShadow: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
            >
              <MessageCircle size={16} />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-headline)', marginBottom: '1.5rem' }}>
            Send a message
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-headline)' }}>Your Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="John Doe"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-headline)' }}>Email Address *</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="john@example.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-headline)' }}>Order Number (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="CZ-1001"
                value={orderNumber} 
                onChange={(e) => setOrderNumber(e.target.value)} 
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-headline)' }}>Message *</label>
              <textarea 
                className="form-textarea" 
                rows={5} 
                placeholder="How can we help you today?"
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                required 
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.8rem', justifyContent: 'center', marginTop: '0.5rem' }} 
              disabled={submitting}
            >
              {submitting ? (
                <span>Sending...</span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Send size={15} />
                  <span>Send Message</span>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
