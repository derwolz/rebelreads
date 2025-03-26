import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { StarRating } from "@/components/star-rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample data
const generateDailyData = (days: number, baseline: number, variance: number) => {
  const data = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    
    // Create some trend-like data with random variance
    const trendFactor = Math.sin((i / days) * Math.PI) * 0.5 + 0.5; // Sinusoidal trend
    const impressions = Math.round(baseline * (1 + trendFactor) + Math.random() * variance);
    const referrals = Math.round(impressions * (0.05 + Math.random() * 0.05)); // 5-10% of impressions
    const wishlists = Math.round(referrals * (0.3 + Math.random() * 0.2)); // 30-50% of referrals
    
    data.push({
      date: dateStr,
      impressions,
      referrals,
      wishlists,
    });
  }
  return data;
};

// Sample book data
const sampleBooks = [
  {
    id: 1,
    title: "The Quantum Protocol",
    author: "Alexandra Chen",
    coverUrl: "/images/book-cover-1.jpg",
    ratings: {
      overall: 4.7,
      writing: 4.8,
      characters: 4.6,
      worldbuilding: 4.9,
      themes: 4.5,
    },
    metrics: generateDailyData(30, 150, 50),
  },
  {
    id: 2,
    title: "Echoes of Eternity",
    author: "Marcus Winters",
    coverUrl: "/images/book-cover-2.jpg",
    ratings: {
      overall: 4.3,
      writing: 4.5,
      characters: 4.2,
      worldbuilding: 4.0,
      themes: 4.4,
    },
    metrics: generateDailyData(30, 120, 40),
  },
  {
    id: 3,
    title: "Shadows of the Mind",
    author: "Isabel Lawrence",
    coverUrl: "/images/manuscript.svg", // Using existing SVG
    ratings: {
      overall: 4.8,
      writing: 4.7,
      characters: 4.9,
      worldbuilding: 4.6,
      themes: 4.8,
    },
    metrics: generateDailyData(30, 200, 60),
  },
];

interface BookMetricCardProps {
  book: (typeof sampleBooks)[0];
}

function BookMetricCard({ book }: BookMetricCardProps) {
  return (
    <Card className="w-full h-full overflow-hidden bg-card/60 backdrop-blur-sm border border-primary/20">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start gap-4">
          <div className="w-20 h-28 rounded overflow-hidden bg-muted">
            <img
              src={book.coverUrl}
              alt={`Cover of ${book.title}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.src = "/images/author-journey.svg";
              }}
            />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-primary">
              {book.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{book.author}</p>
            <div className="mt-2 flex items-center">
              <span className="font-medium mr-2">{book.ratings.overall}</span>
              <StarRating rating={book.ratings.overall} readOnly size="sm" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
          <div>
            <p className="text-xs text-muted-foreground">Writing</p>
            <StarRating rating={book.ratings.writing} readOnly size="xs" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Characters</p>
            <StarRating rating={book.ratings.characters} readOnly size="xs" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Worldbuilding</p>
            <StarRating rating={book.ratings.worldbuilding} readOnly size="xs" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Themes</p>
            <StarRating rating={book.ratings.themes} readOnly size="xs" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BookMetricsDashboard() {
  const [selectedBook, setSelectedBook] = React.useState(sampleBooks[0]);
  const last7Days = selectedBook.metrics.slice(-7);
  const last30Days = selectedBook.metrics;

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 bg-background/40 backdrop-blur-sm rounded-lg">
      <h3 className="text-xl font-semibold text-primary">Book Performance Analytics</h3>
      
      {/* Book selection tabs */}
      <Tabs defaultValue="book1" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="book1" onClick={() => setSelectedBook(sampleBooks[0])}>
            Book 1
          </TabsTrigger>
          <TabsTrigger value="book2" onClick={() => setSelectedBook(sampleBooks[1])}>
            Book 2
          </TabsTrigger>
          <TabsTrigger value="book3" onClick={() => setSelectedBook(sampleBooks[2])}>
            Book 3
          </TabsTrigger>
        </TabsList>
        
        <div className="grid md:grid-cols-[1fr,2fr] gap-4">
          {/* Book details card */}
          <div>
            <BookMetricCard book={selectedBook} />
          </div>
          
          {/* Metrics visualization */}
          <div className="bg-card/60 backdrop-blur-sm rounded-lg border border-primary/20 p-4">
            <Tabs defaultValue="week">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium">Performance Metrics</h4>
                <TabsList>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="week" className="mt-0">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={last7Days}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="referrals"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="wishlists"
                      stroke="#ffc658"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="month" className="mt-0">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={last30Days}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" tickFormatter={(value, index) => index % 5 === 0 ? value : ''} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="impressions"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="referrals"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="wishlists"
                      stroke="#ffc658"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
            
            {/* Summary statistics */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="p-2 bg-primary/10 rounded-md">
                <p className="text-xs text-muted-foreground">Total Impressions</p>
                <p className="text-lg font-bold text-primary">
                  {selectedBook.metrics.reduce((sum, day) => sum + day.impressions, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-md">
                <p className="text-xs text-muted-foreground">Total Referrals</p>
                <p className="text-lg font-bold text-primary">
                  {selectedBook.metrics.reduce((sum, day) => sum + day.referrals, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-md">
                <p className="text-xs text-muted-foreground">Total Wishlists</p>
                <p className="text-lg font-bold text-primary">
                  {selectedBook.metrics.reduce((sum, day) => sum + day.wishlists, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}