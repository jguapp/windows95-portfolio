"use client"

import React from "react"

export default function AboutMe() {
  return (
    <div className="bg-[#D8DFEA] text-black h-full overflow-auto">
      {/* TheFacebook header with integrated navigation */}
      <div className="w-full bg-[#3B5998]">
        <div className="relative h-[130px]">
          {/* Main header background with image */}
          <div className="absolute inset-0">
            <img
              src="/images/blob/thefacebook-header.png"
              alt="TheFacebook Header"
              className="w-full h-full object-cover object-center"
              style={{ imageRendering: "auto" }}
            />
          </div>

          {/* Navigation links directly on top of the header */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end pr-[19%] space-x-6 text-white text-sm">
            <a href="#" className="hover:underline">
              home
            </a>
            <a href="#" className="hover:underline">
              search
            </a>
            <a href="#" className="hover:underline">
              global
            </a>
            <a href="#" className="hover:underline">
              social net
            </a>
            <a href="#" className="hover:underline">
              invite
            </a>
            <a href="#" className="hover:underline">
              faq
            </a>
            <a href="#" className="hover:underline">
              logout
            </a>
          </div>
        </div>
      </div>

      <div className="flex p-4 gap-4 h-[calc(100%-75px)] min-h-[calc(100vh-75px)]">
        {/* Left Sidebar */}
        <div className="w-48 flex flex-col gap-4 h-full relative">
          {/* Combined Quick Search and Advertisement Box */}
          <div className="flex flex-col">
            {/* Quick Search Box */}
            <div className="bg-white p-3 border border-[#B7B7B7] border-b-0">
              <div className="border border-dashed border-[#538ADC] p-2 mb-3">
                <div>
                  <input type="text" placeholder="" className="px-2 py-1 text-xs w-full border border-[#B7B7B7]" />
                </div>
                <div className="text-xs text-black mt-1 flex items-center">
                  <span>quick search</span>
                  <button className="bg-[#42a4f5] text-white px-2 py-0.5 text-xs ml-2 w-12">go</button>
                </div>
              </div>
              <ul className="text-[#42b3f5] text-sm space-y-1 border border-dashed border-[#538ADC] p-2">
                <li>
                  <a href="#" className="hover:underline">
                    My Profile [ edit ]
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    My Friends
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    My Groups
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    My Parties
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    My Messages
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    My Account
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:underline">
                    My Privacy
                  </a>
                </li>
              </ul>
            </div>

            {/* Advertisement Space - McDonald's 90s Ad */}
            <div
              className="bg-white border border-[#B7B7B7] flex flex-col flex-grow h-full overflow-hidden"
              style={{ minHeight: "calc(100vh - 290px)" }}
            >
              <div className="flex-1 flex items-stretch h-full">
                <div className="w-full h-full flex flex-col justify-center bg-white">
                  <img
                    src="/images/blob/skyscraper-ad.png"
                    alt="Advertisement"
                    className="h-full w-full object-cover"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Wrapped in a border with header */}
        <div className="flex-1">
          <div className="border border-[#B7B7B7] bg-white">
            {/* Main Profile Header */}
            <div className="flex w-full">
              <div className="bg-[#3B5998] text-white px-2 py-1 text-sm font-bold flex-1">
                Joel Vasquez&apos;s Profile
              </div>
              <div className="bg-[#3B5998] text-white px-2 py-1 text-sm font-bold flex-1 text-right">
                Baruch College
              </div>
            </div>

            {/* Profile Content */}
            {/* The profile is a two-column 2005 layout and does not become a
                one-column one gracefully. Below its natural width it keeps its
                shape and the window scrolls, which is what a browser of the
                period did, rather than squeezing the right column to nothing
                and clipping it. */}
            <div className="p-4 flex gap-4 min-w-[820px]">
              {/* Left Column */}
              <div className="w-[300px] space-y-4">
                {/* Picture Section */}
                <div className="bg-white border border-[#B7B7B7]">
                  <div className="bg-[#3B5998] text-white px-1 py-1 text-sm font-bold">Picture</div>
                  <div className="p-3 flex justify-center">
                    <img
                      src="/images/blob/profile-headshot.jpeg"
                      alt="Profile"
                      // theFacebook's photo box was portrait. The source is 4:5
                      // and so is this, so nothing is cropped off at all.
                      className="h-[190px] w-[152px] object-cover"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-0 -ml-2">
                  <button className="w-full bg-white border border-[#538ADC] px-3 py-1 text-[#42b3f5] text-sm hover:underline text-left">
                    Send Joel a Message
                  </button>
                  <button className="w-full bg-white border border-[#538ADC] px-3 py-1 text-[#42b3f5] text-sm hover:underline text-left">
                    Poke Him!
                  </button>
                </div>

                {/* Connection */}
                <div className="bg-white border border-[#B7B7B7]">
                  <div className="bg-[#3B5998] text-white px-1 py-1 text-sm font-bold">Connection</div>
                  <div className="p-3 text-sm text-center">You are viewing Joel&apos;s profile.</div>
                </div>

                {/* Mutual Friends */}
                <div className="bg-white border border-[#B7B7B7]">
                  <div className="bg-[#3B5998] text-white px-1 py-1 text-sm font-bold">Mutual Friends</div>
                  <div className="p-3 text-sm">
                    You have <span className="text-[#42b3f5]">16 friends</span> in common.
                  </div>
                </div>

                {/* Friends */}
                <div className="bg-white border border-[#B7B7B7]">
                  <div className="bg-[#3B5998] text-white px-1 py-1 text-sm font-bold">Friends at Baruch College</div>
                  <div className="p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {/* Friend Grid - First Row */}
                      <div className="text-center">
                        <img
                          src="/images/blob/finn.jpeg"
                          alt="Friend"
                          className="w-16 h-16 object-cover mx-auto mb-1"
                        />
                        <a href="#" className="text-black text-xs hover:underline">
                          Finn
                        </a>
                      </div>
                      <div className="text-center">
                        <img
                          src="/images/blob/0a3bb1327b9e5f47b8793c63542219da.jpeg"
                          alt="Friend"
                          className="w-16 h-16 object-cover mx-auto mb-1"
                        />
                        <a href="#" className="text-black text-xs hover:underline">
                          Lelouch
                        </a>
                      </div>
                      <div className="text-center">
                        <img
                          src="/images/blob/plau5p3a-400x400.jpeg"
                          alt="Friend"
                          className="w-16 h-16 object-cover mx-auto mb-1"
                        />
                        <a href="#" className="text-black text-xs hover:underline">
                          Cloud
                        </a>
                      </div>
                      {/* Friend Grid - Second Row */}
                      <div className="text-center">
                        <img
                          src="/images/blob/d0547869a59f49cdcb23cf042d125d52.jpeg"
                          alt="Friend"
                          className="w-16 h-16 object-cover mx-auto mb-1"
                        />
                        <a href="#" className="text-black text-xs hover:underline">
                          Pancham
                        </a>
                      </div>
                      <div className="text-center">
                        <img
                          src="/images/blob/6jgfqdqw0dkb1.png"
                          alt="Friend"
                          className="w-16 h-16 object-cover mx-auto mb-1"
                        />
                        <a href="#" className="text-black text-xs hover:underline">
                          Aigis
                        </a>
                      </div>
                      <div className="text-center">
                        <img
                          src="/images/blob/a75a12a66a148b903918388091c9bdcd.jpeg"
                          alt="Friend"
                          className="w-16 h-16 object-cover mx-auto mb-1"
                        />
                        <a href="#" className="text-black text-xs hover:underline">
                          Vader
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Information */}
              <div className="flex-1">
                <div className="bg-white border border-[#B7B7B7] w-full h-[719px] overflow-auto">
                  <div className="bg-[#3B5998] text-white px-1 py-1 text-sm font-bold">Information</div>
                  <div className="p-4">
                    <div className="space-y-2">
                      {/* Account Info */}
                      <div>
                        <h5 className="font-bold mb-0.5 text-sm">Account Info:</h5>
                        <table className="text-sm">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Name:</td>
                              <td>Joel Vasquez</td>
                            </tr>
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Member Since:</td>
                              <td>February 4, 2004</td>
                            </tr>
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Last Update:</td>
                              <td>August 13, 2026</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Basic Info */}
                      <div>
                        <h5 className="font-bold mb-0.5 text-sm">Basic Info:</h5>
                        <table className="text-sm">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="w-[124px] pr-4 align-top">School:</td>
                              <td className="text-[#42b3f5]">Baruch College '27</td>
                            </tr>
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Status:</td>
                              <td>Student</td>
                            </tr>
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Sex:</td>
                              <td className="text-[#42b3f5]">Male</td>
                            </tr>
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Residence:</td>
                              <td className="text-[#42b3f5]">New York, NY</td>
                            </tr>
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Birthday:</td>
                              <td>May 21st</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Contact Info */}
                      <div>
                        <h5 className="font-bold mb-0.5 text-sm">Contact Info:</h5>
                        <table className="text-sm">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Email:</td>
                              <td className="text-[#42b3f5]">jfvasq1@gmail.com</td>
                            </tr>
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Screename:</td>
                              <td className="text-[#42b3f5]">jguapp</td>
                            </tr>
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Websites:</td>
                              <td className="text-[#42b3f5] break-words">
                                https://github.com/jguapp
                                <br />
                                https://www.linkedin.com/in/jvasquezcs/
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Personal Info */}
                      <div>
                        <h5 className="font-bold mb-0.5 text-sm">Personal Info:</h5>
                        <table className="text-sm w-full">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Looking For:</td>
                              <td className="text-[#42b3f5]">Networking, New Grad Opportunities</td>
                            </tr>
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Interested In:</td>
                              <td className="text-[#42b3f5]">Machine Learning, Data Science, Web Development</td>
                            </tr>
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Interests:</td>
                              <td className="text-[#42b3f5] break-words">
                                Reading, Writing, Open Source, Basketball, Legos, Watching Movies, Guitar, Gaming, Math,
                                Coding, Working Out, Sleeping
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Favorite Music */}
                      <div>
                        <table className="text-sm w-full">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Favorite Music:</td>
                              <td className="text-[#42b3f5] break-words">
                                The Strokes, Arctic Monkeys, Radiohead, Mac Miller, Kendrick Lamar, Bob Dylan, Marvin
                                Gaye, Faye Webster, Stevie Wonder, Queen, Michael Jackson, Billy Joel, Tame Impala
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Favorite Movies */}
                      <div>
                        <table className="text-sm w-full">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="w-[124px] pr-4 align-top">Favorite Movies:</td>
                              <td className="text-[#42b3f5] break-words">
                                Fantastic Mr. Fox, The Truman Show, The Grand Budapest Hotel, Pitch Perfect, Spiderman
                                2, Good Will Hunting, Star Wars
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* About Me */}
                      <div>
                        <table className="text-sm w-full">
                          <tbody className="leading-tight">
                            <tr>
                              <td className="w-[124px] pr-4 align-top">About Me:</td>
                              <td>
                                Hi there! I&apos;m Joel, a Computer Science student at Baruch College, graduating
                                in 2027. I build backend and infrastructure: the things that have to keep working when
                                nobody is watching them. This summer I&apos;m a Software Engineer Intern at Liberty
                                Mutual, where I'm building a Kubernetes right-sizing engine and an automated disaster recovery tool
                                for virtual machines. Before that I spent a year deploying AI agents at the Robert Wood Johnson Foundation 
                                and two years doing data work at the CUNY Institute for Demographic Research. Outside work I
                                help run the ColorStack chapter here at Baruch, and I build things like the desktop you are reading this on.
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
