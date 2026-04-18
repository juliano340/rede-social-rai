import { NgModule } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  Search,
  User,
  MessageCircle,
  Heart,
  Trash2,
  Pencil,
  Calendar,
  Bell,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  X,
  Home,
  ChevronDown,
} from 'lucide-angular';

@NgModule({
  imports: [
    LucideAngularModule.pick({
      Search,
      User,
      MessageCircle,
      Heart,
      Trash2,
      Pencil,
      Calendar,
      Bell,
      LogOut,
      Sun,
      Moon,
      Sparkles,
      X,
      Home,
      ChevronDown,
    }),
  ],
  exports: [LucideAngularModule],
})
export class LucideIconsModule {}
