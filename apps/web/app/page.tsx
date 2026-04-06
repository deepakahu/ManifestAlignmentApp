import Link from 'next/link';
import { HeroCarousel } from '@/components/landing/HeroCarousel';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-bold text-xl text-slate-900">Manifestation</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Carousel - Full Width */}
      <section className="w-full">
        <HeroCarousel />
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600">Transform your dreams into reality in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Set Your Vision</h3>
              <p className="text-slate-600">
                Create manifestations with clear intentions, affirmations, and visualization notes. Define what success looks like.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Build Daily Habits</h3>
              <p className="text-slate-600">
                Break down goals into trackable activities. Log daily progress with different tracking types and build unstoppable streaks.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-pink-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Stay Accountable</h3>
              <p className="text-slate-600">
                Create challenges with real stakes. Invite accountability partners to verify your progress and win your prize.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features - Detailed */}
      <section className="px-6 py-20 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-slate-600">Powerful features designed for lasting transformation</p>
          </div>

          <div className="space-y-24">
            {/* Feature 1 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
                  SMART Goals
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Structured Goal Framework</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Create goals using the proven SMART framework - Specific, Measurable, Achievable, Relevant, and Time-bound. Track progress automatically or set manual milestones.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Organize goals by custom categories</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Set target dates and track completion percentage</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Visual progress bars and analytics</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
                <div className="space-y-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-sm opacity-90 mb-1">Health & Fitness</p>
                    <p className="font-semibold text-lg">Run a Marathon</p>
                    <div className="mt-3 w-full h-2 bg-white/30 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full" style={{ width: '75%' }} />
                    </div>
                    <p className="text-xs mt-2 opacity-90">75% Complete</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 text-white shadow-2xl">
                <div className="space-y-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold">30-Day Fitness Challenge</span>
                      <span className="text-2xl">💰</span>
                    </div>
                    <p className="text-sm opacity-90 mb-2">Prize: $500.00</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-white/30 rounded">5 Participants</span>
                      <span className="px-2 py-1 bg-green-500/50 rounded">12 Days Left</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-block px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">
                  Accountability System
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Put Real Stakes on the Line</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Create challenges with monetary stakes that you win back only when you complete all activities. Invite accountability partners to verify your submissions.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Set custom prize amounts and currencies</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Invite friends as accountability partners</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Approval system prevents cheating</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
                  Flexible Tracking
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Track Any Type of Activity</h3>
                <p className="text-lg text-slate-600 mb-6">
                  Boolean checkboxes, numeric values, multi-select options, or free-form text - track activities your way with custom frequency patterns.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Daily, specific days, or custom date patterns</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Smart reminders via push, email, SMS, or alarms</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">Streak tracking with freeze protection</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-8 text-white shadow-2xl">
                <div className="space-y-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
                    <span className="font-medium">Morning Meditation</span>
                    <span className="text-2xl">✓</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <span className="font-medium block mb-2">Water Intake</span>
                    <div className="flex items-center gap-2">
                      <input type="range" className="flex-1" value="6" max="8" readOnly />
                      <span className="text-sm">6/8 cups</span>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium block">🔥 Current Streak</span>
                      <span className="text-2xl font-bold">24 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold text-indigo-600 mb-2">10K+</p>
              <p className="text-slate-600">Active Users</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-indigo-600 mb-2">50K+</p>
              <p className="text-slate-600">Goals Achieved</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-indigo-600 mb-2">1M+</p>
              <p className="text-slate-600">Activities Logged</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-indigo-600 mb-2">92%</p>
              <p className="text-slate-600">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Turn Your Dreams Into Reality?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of people who are already achieving their goals with accountability and discipline.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Start Free Today
            </Link>
            <Link
              href="/login"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
          <p className="mt-6 text-sm opacity-75">No credit card required • Get started in 2 minutes</p>
        </div>
      </section>

      {/* Additional Features */}
      <section className="px-6 py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Mood Tracking</h3>
            <p className="text-slate-600">
              Track your daily moods, identify patterns, and understand your emotional journey over time.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Progress Analytics</h3>
            <p className="text-slate-600">
              Visualize your progress with charts, streaks, and completion rates across all your goals.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Smart Reminders</h3>
            <p className="text-slate-600">
              Set customizable alarms to stay consistent with your practice and never miss a moment of reflection.
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Manifestation. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-500 hover:text-slate-700 text-sm">Privacy</a>
            <a href="#" className="text-slate-500 hover:text-slate-700 text-sm">Terms</a>
            <a href="#" className="text-slate-500 hover:text-slate-700 text-sm">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
