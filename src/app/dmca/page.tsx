"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SidebarRail } from "@/components/SidebarRail";
import { FloatingNavbar } from "@/components/FloatingNavbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AZFooter } from "@/components/AZFooter";
import { ShieldCheck, Mail, ArrowLeft, AlertCircle, FileText } from "lucide-react";

export default function DmcaPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("home");
  const [activeNav, setActiveNav] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-[#08080c] text-neutral-100 flex flex-row selection:bg-purple-600 selection:text-white relative">
      <SidebarRail
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "home") router.push("/");
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6 relative">
        <FloatingNavbar
          activeNav={activeNav}
          onNavClick={(nav) => {
            setActiveNav(nav);
            if (nav === "home") router.push("/");
            if (nav === "animes") router.push("/animes");
            if (nav === "cartoon") router.push("/cartoon");
            if (nav === "genres") router.push("/genres");
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-8 pt-24 pb-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6 select-none">
            <Link
              href="/"
              className="inline-flex items-center gap-1 hover:text-purple-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <span>/</span>
            <span className="text-white font-medium">DMCA & Copyright</span>
          </div>

          {/* DMCA Document Container */}
          <div className="rounded-3xl bg-[#11101b]/90 border border-purple-500/20 p-6 sm:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-8">
            {/* Header Badge */}
            <div className="flex items-center gap-3 pb-6 border-b border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Copyright & Takedown Requests
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Senkai Sora Intellectual Property & DMCA Policy
                </p>
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6 text-sm text-neutral-300 leading-relaxed">
              <p>
                We respect the hard work of anime artists, animators, studios, publishers, and other rights holders. We support the protection of intellectual property and take copyright concerns seriously.
              </p>

              <p>
                If you are a copyright holder or an authorized representative and believe that your content is being made accessible through <strong>Senkai Sora</strong> without appropriate authorization, please contact the service owner by email with the relevant details and proof of ownership.
              </p>

              <p>
                We will review legitimate requests and cooperate with rights holders to address the matter, including removing or disabling access to the identified content or third-party source where appropriate.
              </p>

              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-purple-200">
                  <strong>Contact:</strong> Please email the service owner for copyright concerns, content removal requests, or other service-related inquiries.
                </p>
              </div>

              <p className="text-xs text-neutral-400 italic">
                Senkai Sora is an independent platform and is not affiliated with or endorsed by any anime studio, publisher, or streaming provider unless explicitly stated.
              </p>
            </div>

            {/* DMCA Takedown Requirements */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span>DMCA takedown requirements</span>
              </h2>
              <p className="text-sm text-neutral-300 leading-relaxed">
                We take the intellectual property rights of others seriously and require that our Users do the same. The Digital Millennium Copyright Act (DMCA) established a process for addressing claims of copyright infringement. If you own a copyright or have authority to act on behalf of a copyright owner and want to report a claim that a third party is infringing that material on or through GitLab's services, please submit a DMCA report on our Contact page, and we will take appropriate action.
              </p>
            </div>

            {/* DMCA Report Requirements List */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h3 className="text-lg font-bold text-white tracking-tight">
                DMCA Report requirements
              </h3>
              <ul className="space-y-3 text-sm text-neutral-300 list-disc pl-5">
                <li>A description of the copyrighted work that you claim is being infringed;</li>
                <li>A description of the material you claim is infringing and that you want removed or access to which you want disabled and the URL or other location of that material;</li>
                <li>Your name, title (if acting as an agent), address, telephone number, and email address;</li>
                <li>The following statement: "I have a good faith belief that the use of the copyrighted material I am complaining of is not authorized by the copyright owner, its agent, or the law (e.g., as a fair use)";</li>
                <li>The following statement: "The information in this notice is accurate and, under penalty of perjury, I am the owner, or authorized to act on behalf of the owner, of the copyright or of an exclusive right that is allegedly infringed";</li>
                <li>An electronic or physical signature of the owner of the copyright or a person authorized to act on the owner's behalf.</li>
              </ul>
            </div>

            {/* Submission Email Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 via-[#181628] to-purple-950/30 border border-purple-500/40 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Mail className="w-4 h-4 text-purple-400" />
                <span>Your DMCA take down request should be submit here:</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href="mailto:animeworldreport@proton.me"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-sm font-bold shadow-[0_0_15px_rgba(147,51,234,0.5)] transition inline-flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>animeworldreport@proton.me</span>
                </a>
              </div>
              <p className="text-xs text-neutral-400 pt-1">
                We will then review your DMCA request and take proper actions, including removal of the content from the website.
              </p>
            </div>
          </div>
        </main>

        <AZFooter />
      </div>

      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "home") router.push("/");
        }}
        myListCount={0}
      />
    </div>
  );
}
