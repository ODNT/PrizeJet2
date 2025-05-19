import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold">PrizeJet</h1>
        <div className="flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </header>

      <main>
        {/* Contest Types Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Win Amazing Prizes</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join PrizeJet and get a chance to win incredible prizes through our exciting contests and giveaways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Draws</CardTitle>
                <CardDescription>Enter our daily prize draws</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Participate in our daily draws for a chance to win exciting prizes every day. New prizes announced daily!</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Enter Now</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Contests</CardTitle>
                <CardDescription>Bigger prizes, more excitement</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Our weekly contests offer bigger prizes and more chances to win. Complete challenges to increase your odds!</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">View Contests</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Jackpots</CardTitle>
                <CardDescription>Life-changing prizes await</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Our monthly jackpots feature premium prizes that could change your life. Don't miss your chance!</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Learn More</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Getting started with PrizeJet is easy. Follow these simple steps to begin your winning journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2">Create an Account</h3>
              <p className="text-muted-foreground">Sign up for free and set up your profile to get started.</p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2">Enter Contests</h3>
              <p className="text-muted-foreground">Browse available contests and enter the ones you like.</p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2">Win Prizes</h3>
              <p className="text-muted-foreground">Get notified when you win and claim your amazing prizes!</p>
            </div>
          </div>
        </section>

        {/* Featured Prizes Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Featured Prizes</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Check out some of our most exciting prizes currently up for grabs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Latest Smartphone</CardTitle>
                <Badge className="mt-1">Technology</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-muted rounded-md mb-2 flex items-center justify-center text-muted-foreground">
                  [Phone Image]
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold">Value: $999</span>
                  <span className="text-sm text-muted-foreground">Ends in 2 days</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="sm">Enter Draw</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Gaming Console</CardTitle>
                <Badge className="mt-1">Gaming</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-muted rounded-md mb-2 flex items-center justify-center text-muted-foreground">
                  [Console Image]
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold">Value: $499</span>
                  <span className="text-sm text-muted-foreground">Ends in 5 days</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="sm">Enter Draw</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Luxury Watch</CardTitle>
                <Badge className="mt-1">Fashion</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-muted rounded-md mb-2 flex items-center justify-center text-muted-foreground">
                  [Watch Image]
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold">Value: $1,200</span>
                  <span className="text-sm text-muted-foreground">Ends in 1 week</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="sm">Enter Draw</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Travel Voucher</CardTitle>
                <Badge className="mt-1">Travel</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-muted rounded-md mb-2 flex items-center justify-center text-muted-foreground">
                  [Travel Image]
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold">Value: $2,000</span>
                  <span className="text-sm text-muted-foreground">Ends in 2 weeks</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="sm">Enter Draw</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">What Our Winners Say</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Don't just take our word for it. Here's what some of our recent winners have to say.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <p className="italic mb-4">"I never thought I'd actually win! The process was so simple and the prize arrived within days. I'm definitely entering more contests!"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-muted mr-3"></div>
                  <div>
                    <p className="font-semibold">Sarah J.</p>
                    <p className="text-sm text-muted-foreground">Won a Smart TV</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="italic mb-4">"PrizeJet is amazing! I've won twice now and both experiences were fantastic. The team is super helpful and responsive."</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-muted mr-3"></div>
                  <div>
                    <p className="font-semibold">Michael T.</p>
                    <p className="text-sm text-muted-foreground">Won Concert Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="italic mb-4">"I was skeptical at first, but PrizeJet is the real deal. I won a weekend getaway and it was exactly as described. Can't wait to enter more!"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-muted mr-3"></div>
                  <div>
                    <p className="font-semibold">Lisa M.</p>
                    <p className="text-sm text-muted-foreground">Won a Weekend Getaway</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-16 px-4 bg-muted rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Winning?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of winners on PrizeJet today. It only takes a minute to sign up and start entering contests!
          </p>
          <Button size="lg" asChild>
            <Link href="/register">Create Your Free Account</Link>
          </Button>
        </section>
      </main>

      <footer className="mt-20 pt-10 border-t">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <h3 className="text-lg font-semibold mb-4">PrizeJet</h3>
            <p className="text-muted-foreground">Making dreams come true with exciting prizes and contests.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/contests" className="text-muted-foreground hover:text-foreground">All Contests</Link></li>
              <li><Link href="/winners" className="text-muted-foreground hover:text-foreground">Recent Winners</Link></li>
              <li><Link href="/how-it-works" className="text-muted-foreground hover:text-foreground">How It Works</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/rules" className="text-muted-foreground hover:text-foreground">Contest Rules</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">Twitter</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">Facebook</Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">Instagram</Link>
            </div>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground pt-8 pb-4 border-t">
          <p>© {new Date().getFullYear()} PrizeJet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
