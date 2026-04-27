import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Locus',
  description: 'Privacy Policy for the Locus mobile application.',
};

const EFFECTIVE_DATE = 'April 27, 2026';
const CONTACT_EMAIL = 'xvinaytiwari@gmail.com';
const APP_NAME = 'Locus';

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-foreground">
      <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <section className="space-y-4 leading-relaxed">
        <p>
          This Privacy Policy describes how {APP_NAME} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
          collects, uses, and protects information when you use the {APP_NAME} mobile
          application (the &quot;App&quot;).
        </p>

        <h2 className="mt-8 text-2xl font-semibold">1. Information We Collect</h2>
        <p>We collect the following information to provide and improve the App:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Account information:</strong> name, email address, and a hashed password
            you provide when creating an account.
          </li>
          <li>
            <strong>Learning progress:</strong> course progress, exercise results, XP, hearts,
            streaks, and other in-app activity required to deliver the learning experience.
          </li>
          <li>
            <strong>Device information:</strong> basic device and OS metadata used for
            authentication, debugging, and crash diagnostics.
          </li>
        </ul>

        <h2 className="mt-8 text-2xl font-semibold">2. How We Use Your Information</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>To create and authenticate your account.</li>
          <li>To save your learning progress and personalize your experience.</li>
          <li>To operate features such as leaderboards, streaks, and rewards.</li>
          <li>To monitor service health and fix bugs.</li>
        </ul>

        <h2 className="mt-8 text-2xl font-semibold">3. Information Sharing</h2>
        <p>
          We do not sell your personal information. We do not share your personal data with
          third parties except as required to operate the App (for example, secure database
          and hosting providers) or to comply with applicable law.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">4. Data Storage and Security</h2>
        <p>
          Your data is stored on secured servers. Passwords are stored using industry-standard
          one-way hashing. We use reasonable technical and organizational measures to protect
          your information; however, no method of transmission or storage is completely secure.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">5. Children&apos;s Privacy</h2>
        <p>
          The App is not intended for children under the age of 13. We do not knowingly
          collect personal information from children under 13. If you believe a child has
          provided us with personal information, please contact us and we will delete it.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">6. Your Rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data at any
          time by contacting us at the email address below. You may also delete your account
          from within the App, which will remove your associated personal data.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">7. Third-Party Services</h2>
        <p>
          The App may use third-party services (such as authentication, push notifications,
          and analytics providers) that collect information used to identify you in accordance
          with their own privacy policies.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. The updated version will be
          indicated by an updated &quot;Effective date&quot; and will be effective as soon as it
          is accessible.
        </p>

        <h2 className="mt-8 text-2xl font-semibold">9. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, contact us at{' '}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </main>
  );
}
