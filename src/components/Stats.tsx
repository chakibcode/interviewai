import { Card } from "@/components/ui/card";
import { TrendingUp, Users, CheckCircle, Clock } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "10K+",
    label: "Active Users",
  },
  {
    icon: CheckCircle,
    value: "95%",
    label: "Success Rate",
  },
  {
    icon: Clock,
    value: "< 30s",
    label: "Analysis Time",
  },
  {
    icon: TrendingUp,
    value: "4.9/5",
    label: "User Rating",
  },
];

const Stats = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="p-8 text-center bg-card/30 backdrop-blur-sm border-accent/10 hover:border-accent/30 transition-all duration-300"
            >
              <stat.icon className="w-8 h-8 text-accent mx-auto mb-4" />
              <div className="text-4xl font-bold text-accent mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
