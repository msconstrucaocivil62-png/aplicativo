import React from 'react';
import { 
  Zap, Wrench, Paintbrush, Monitor, Hammer, Sparkles, Truck, Wind, 
  Shield, Scissors, Smartphone, Cpu, Home, Briefcase, Heart, Star,
  HelpCircle, Settings, CheckCircle, AlertTriangle, Phone, MapPin, Clock,
  Calendar, CreditCard, DollarSign, UserCheck, ShieldCheck, ArrowRight,
  HardHat, Layers, AppWindow, Key, Sofa, Tv, Camera, Wifi, Code,
  Droplets, Utensils, Baby, HeartHandshake, Dog, Trees, Bug, Music, Cake,
  Gift, Wine, PartyPopper, Dumbbell, GraduationCap, Languages, Brain,
  Calculator, Scale, Palette, Car, CarTaxiFront, Smile, Hand, ShieldAlert,
  BookOpen, Building, Stethoscope, Eye, Compass, Sun
} from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
}

export const DynamicIcon: React.FC<IconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'Zap': return <Zap className={className} />;
    case 'Wrench': return <Wrench className={className} />;
    case 'Paintbrush': return <Paintbrush className={className} />;
    case 'Monitor': return <Monitor className={className} />;
    case 'Hammer': return <Hammer className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Truck': return <Truck className={className} />;
    case 'Wind': return <Wind className={className} />;
    case 'Shield': return <Shield className={className} />;
    case 'Scissors': return <Scissors className={className} />;
    case 'Smartphone': return <Smartphone className={className} />;
    case 'Cpu': return <Cpu className={className} />;
    case 'Home': return <Home className={className} />;
    case 'Briefcase': return <Briefcase className={className} />;
    case 'Heart': return <Heart className={className} />;
    case 'Star': return <Star className={className} />;
    case 'Settings': return <Settings className={className} />;
    case 'CheckCircle': return <CheckCircle className={className} />;
    case 'AlertTriangle': return <AlertTriangle className={className} />;
    case 'Phone': return <Phone className={className} />;
    case 'MapPin': return <MapPin className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'Calendar': return <Calendar className={className} />;
    case 'CreditCard': return <CreditCard className={className} />;
    case 'DollarSign': return <DollarSign className={className} />;
    case 'UserCheck': return <UserCheck className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'HardHat': return <HardHat className={className} />;
    case 'Layers': return <Layers className={className} />;
    case 'AppWindow': return <AppWindow className={className} />;
    case 'Key': return <Key className={className} />;
    case 'Sofa': return <Sofa className={className} />;
    case 'Tv': return <Tv className={className} />;
    case 'Camera': return <Camera className={className} />;
    case 'Wifi': return <Wifi className={className} />;
    case 'Code': return <Code className={className} />;
    case 'Broom': return <Sparkles className={className} />;
    case 'Droplets': return <Droplets className={className} />;
    case 'Utensils': return <Utensils className={className} />;
    case 'Baby': return <Baby className={className} />;
    case 'HeartHandshake': return <HeartHandshake className={className} />;
    case 'Dog': return <Dog className={className} />;
    case 'Trees': return <Trees className={className} />;
    case 'Bug': return <Bug className={className} />;
    case 'Music': return <Music className={className} />;
    case 'Cake': return <Cake className={className} />;
    case 'Gift': return <Gift className={className} />;
    case 'Wine': return <Wine className={className} />;
    case 'PartyPopper': return <PartyPopper className={className} />;
    case 'Dumbbell': return <Dumbbell className={className} />;
    case 'GraduationCap': return <GraduationCap className={className} />;
    case 'Languages': return <Languages className={className} />;
    case 'Brain': return <Brain className={className} />;
    case 'Calculator': return <Calculator className={className} />;
    case 'Scale': return <Scale className={className} />;
    case 'Palette': return <Palette className={className} />;
    case 'Car': return <Car className={className} />;
    case 'CarTaxiFront': return <CarTaxiFront className={className} />;
    case 'Smile': return <Smile className={className} />;
    case 'Hand': return <Hand className={className} />;
    case 'ShieldAlert': return <ShieldAlert className={className} />;
    case 'BookOpen': return <BookOpen className={className} />;
    case 'Building': return <Building className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'Sun': return <Sun className={className} />;
    default: return <Zap className={className} />;
  }
};

