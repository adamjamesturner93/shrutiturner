import type { AuthorProfileContent, BlogPostContent } from "../lib/content/types";

export interface BlogPost extends BlogPostContent {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author?: string;
  authors: AuthorProfileContent[];
  date: string;
  tags: string[];
  readTime: string;
  coverImage: string;
  coverAlt: string;
}

export const blogAuthors: AuthorProfileContent[] = [
  {
    id: "shruti-turner",
    slug: "shruti-turner",
    name: "Shruti Turner",
    role: "Movement & Fitness Coach",
    bio: "Shruti brings together biomechanics research, rehabilitation expertise, personal training, strength and conditioning, yoga and lived experience to help people build movement and training around their body, goals and real life.",
    avatarImageUrl: "/images/shruti.jpeg",
    avatarAlt: "Shruti Turner",
    websiteUrl: "/about",
    instagramHandle: "@shrutiturner",
    isGuestContributor: false,
    active: true,
  },
];

export const blogPosts: BlogPost[] = [
  {
    id: "strength-training-chronic-illness",
    title: "Why Strength Training Matters When You Have Chronic Illness",
    excerpt:
      "Exploring the evidence for resistance training in managing autoimmune conditions, chronic pain and building resilient bodies.",
    coverImage:
      "https://images.unsplash.com/photo-1615388599690-02c0d4a3dfa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlbmd0aCUyMHRyYWluaW5nJTIwcmVoYWJpbGl0YXRpb24lMjBjaHJvbmljJTIwaWxsbmVzc3xlbnwxfHx8fDE3NzI2NDE3NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    coverAlt: "Strength training rehabilitation session",
    content: `
# Why Strength Training Matters When You Have Chronic Illness

When you're living with chronic illness, the idea of strength training might feel counterintuitive. You're managing pain, fatigue and unpredictable symptoms—why would you deliberately stress your body further?

The answer lies in understanding that strength training, when done intelligently, isn't about pushing through pain or ignoring your body's signals. It's about building capacity, improving function and creating resilience.

## The Evidence Base

Research consistently shows that progressive resistance training can:

- Reduce pain and inflammation in rheumatoid arthritis
- Improve functional capacity in chronic fatigue conditions
- Enhance bone density in osteoporosis
- Support joint stability in hypermobility conditions
- Reduce disease activity markers in various autoimmune conditions

## What Makes It Different

This isn't generic gym programming. Rehabilitation-informed strength training means:

1. **Starting where you are** - not where you think you should be
2. **Respecting your body's signals** - distinguishing between discomfort and harm
3. **Programming around flares** - having strategies for both good and difficult days
4. **Focusing on function** - building strength that serves your life
5. **Understanding tissue adaptation** - giving your body time to respond

## Building Resilience, Not Fragility

The goal is to work with your health context, recovery needs and real capacity to build genuine strength.

Strength training for chronic illness requires nuance, patience and expertise. But done well, it can be transformative.
    `,
    author: "Shruti Turner",
    authors: [blogAuthors[0]],
    date: "2026-02-15",
    tags: ["Strength Training", "Chronic Illness", "Evidence-Based"],
    category: "fitness",
    readTime: "6 min read",
  },
  {
    id: "programming-around-flares",
    title: "Programming Strength Training Around Flares and Bad Days",
    excerpt:
      "Practical strategies for maintaining training consistency when chronic illness symptoms fluctuate.",
    coverImage:
      "https://images.unsplash.com/photo-1580618849092-0b800b9b05d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjByZXN0aW5nJTIwcmVjb3ZlcnklMjBmaXRuZXNzJTIwZmF0aWd1ZXxlbnwxfHx8fDE3NzI2NDE3NDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    coverAlt: "Person resting between training sets",
    content: `
# Programming Strength Training Around Flares and Bad Days

One of the biggest challenges of training with chronic illness is that your capacity isn't consistent. What you could do last week might be completely impossible today.

This doesn't mean you can't train. It means you need a different approach to programming.

## The Three-Tier System

I work with clients using a three-tier programming approach:

### Tier 1: Optimal Days
This is your full training session—the work you do when your body is cooperating. Progressive overload, challenging loads, full range of motion work.

### Tier 2: Moderate Days
Reduced volume, maintained intensity. You're still training, but with modifications that respect increased fatigue or mild symptom flares.

### Tier 3: Survival Days
Minimal viable movement. This might be a single movement, very light loads, or even just nervous system regulation work. The goal is maintenance, not progress.

## Making It Work

The key is having all three tiers pre-planned. When you wake up feeling terrible, you don't have to think—you already know what Tier 3 looks like.

This removes the decision fatigue and the guilt. You're not "failing" by doing less. You're following your program.

## Progress Isn't Linear

With chronic illness, progress looks different. Some weeks you'll nail all your Tier 1 sessions. Other weeks you'll live in Tier 3. That's not failure—that's reality.

Over time, you might find that your Tier 3 looks like your old Tier 1. That's progress.

## The Long Game

Building strength with chronic illness requires patience, flexibility and self-compassion. But it's absolutely possible.

You don't need to be consistent every day. You need to be persistent over time.
    `,
    author: "Shruti Turner",
    authors: [blogAuthors[0]],
    date: "2026-02-05",
    tags: ["Strength Training", "Chronic Illness", "Programming"],
    category: "fitness",
    readTime: "7 min read",
  },
  {
    id: "hypermobility-strength-training",
    title: "Strength Training for Hypermobility: What You Need to Know",
    excerpt:
      "Essential principles for building strength and stability when you have hypermobile joints.",
    coverImage:
      "https://images.unsplash.com/photo-1516208685347-1db8b6b227dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbGV4aWJsZSUyMHN0cmV0Y2hpbmclMjBtb2JpbGl0eSUyMGV4ZXJjaXNlfGVufDF8fHx8MTc3MjY0MTc0NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    coverAlt: "Mobility and flexibility exercise demonstration",
    content: `
# Strength Training for Hypermobility: What You Need to Know

If you're hypermobile, you've probably been told you're "naturally flexible" as if it's a gift. In reality, excessive joint range without corresponding strength and control creates pain, instability and injury risk.

## The Hypermobility Challenge

Hypermobile joints can move beyond typical ranges, but this doesn't mean they should. Without adequate muscular control, your joints become unstable, leading to:

- Chronic pain
- Frequent subluxations or dislocations
- Joint degradation over time
- Difficulty with proprioception (knowing where your body is in space)
- Fatigue from constant muscle guarding

## What Helps

Strength training for hypermobility requires specific strategies:

### 1. Control End-Range
Never push into your maximum range of motion. Work in your middle ranges where you can maintain control and stability.

### 2. Build Eccentric Strength
The ability to control movement as you lengthen (eccentric strength) is crucial for joint protection.

### 3. Focus on Stability
Multi-joint compound movements that require coordination and stability are more valuable than isolated exercises.

### 4. Prioritize Proprioception
Your nervous system needs to know where your joints are. This takes dedicated practice.

### 5. Be Patient
Building strength and stability in hypermobile bodies takes time. Tissue adaptation doesn't happen overnight.

## Common Mistakes

- Stretching when you need strength
- Using full range of motion because you can
- Prioritizing flexibility over control
- Comparing yourself to non-hypermobile bodies

## The Goal

The goal isn't to eliminate your hypermobility—that's not possible. It's to build enough strength and control around your joints that your flexibility becomes an asset rather than a liability.

With proper programming, hypermobile bodies can be incredibly strong and capable. But it requires working with your body's reality, not against it.
    `,
    author: "Shruti Turner",
    authors: [blogAuthors[0]],
    date: "2026-01-28",
    tags: ["Hypermobility", "Strength Training", "Joint Health"],
    category: "rehabilitation",
    readTime: "6 min read",
  },
  {
    id: "building-training-capacity",
    title: "Building Training Capacity When You Start From Zero",
    excerpt:
      "How to begin strength training when chronic illness has left you deconditioned and where generic beginner programs don't apply.",
    coverImage:
      "https://images.unsplash.com/photo-1709315859957-3b3583bf364c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWdpbm5lciUyMHdlaWdodGxpZnRpbmclMjBzdGFydGluZyUyMGd5bSUyMGJhcmJlbGx8ZW58MXx8fHwxNzcyNjQxNzQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    coverAlt: "Beginner approaching weightlifting equipment",
    content: `
# Building Training Capacity When You Start From Zero

Starting strength training when you're deconditioned from chronic illness is different from being a typical beginner. You're not just untrained—you might be dealing with pain, fatigue, nervous system dysregulation and years of being told to "rest."

## The Reality of Deconditioning

Long-term illness often leads to:
- Muscle loss
- Reduced cardiovascular capacity
- Decreased bone density
- Loss of movement patterns
- Fear of movement
- Reduced confidence in your body

Generic "beginner" programs don't account for this reality.

## Starting Point Matters

Your starting point might be:
- Standing exercises only
- Very light resistance bands
- Bodyweight movements with significant support
- Short duration sessions (10-15 minutes)
- Frequent rest periods

This isn't where you'll stay. This is where you start.

## The Principles

### 1. Start Stupidly Easy
If you're unsure, go lighter/easier/shorter. You can always add more next session.

### 2. Prioritize Consistency
Training twice a week for three months beats training hard for two weeks and then stopping.

### 3. Expect Adaptation Time
Your nervous system adapts first (weeks), then your muscles (months), then your connective tissue (many months). Respect this timeline.

### 4. Measure What Matters
Progress might be: less pain, more energy, better sleep, improved mood, or easier daily activities—not just weights lifted.

### 5. Plan for Setbacks
Flares happen. Life happens. Your program should have built-in flexibility.

## What Progress Looks Like

Week 1: Just showing up is progress
Month 1: Establishing routine and tolerating sessions
Month 3: Noticing genuine adaptations
Month 6: Achieving things you couldn't do when you started
Year 1: Building on a solid foundation

## The Mindset Shift

This isn't about getting back to some previous version of yourself. It's about building capacity from where you are now.

Your body can get stronger. Your symptoms can improve. Your function can increase.

But it requires patience, intelligent programming and consistent effort.

You're not broken. You're building.
    `,
    author: "Shruti Turner",
    authors: [blogAuthors[0]],
    date: "2026-01-12",
    tags: ["Beginners", "Strength Training", "Chronic Illness"],
    category: "fitness",
    readTime: "6 min read",
  },
];
