import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  currentDate = new Date();
  activeFilter: string = 'month';

  // Stats with Wifak Bank colors
  stats = [
    {
      value: 2,
      label: 'Total Utilisateurs',
      percentage: 12.5,
      trend: 'up',
      icon: 'bi bi-people-fill',
      bgColor: '#47617f',
      iconColor: '#ffffff',
      progress: 75
    },
    {
      value: 11,
      label: 'Total Rôles',
      percentage: 5.2,
      trend: 'up',
      icon: 'bi bi-shield-lock-fill',
      bgColor: '#6f869f',
      iconColor: '#ffffff',
      progress: 55
    },
    {
      value: 4,
      label: 'Total Départements',
      percentage: 0,
      trend: 'up',
      icon: 'bi bi-building',
      bgColor: '#899baa',
      iconColor: '#ffffff',
      progress: 40
    },
    {
      value: 2,
      label: 'Utilisateurs Actifs',
      percentage: 8.7,
      trend: 'up',
      icon: 'bi bi-person-check-fill',
      bgColor: '#db1b05',
      iconColor: '#ffffff',
      progress: 65
    }
  ];

  // Chart Data
  chartData = [
    { label: 'Jan', primary: 45, secondary: 30 },
    { label: 'Fév', primary: 55, secondary: 35 },
    { label: 'Mar', primary: 70, secondary: 45 },
    { label: 'Avr', primary: 60, secondary: 50 },
    { label: 'Mai', primary: 85, secondary: 55 },
    { label: 'Juin', primary: 95, secondary: 60 },
    { label: 'Juil', primary: 80, secondary: 65 }
  ];

  // Activity Feed
  recentActivities = [
    {
      text: 'Nouvel utilisateur inscrit: Ahmed Ben Ali',
      time: 'Il y a 5 minutes',
      color: '#47617f',
      icon: 'bi bi-person-plus',
      type: 'success'
    },
    {
      text: 'Transaction #TX-2024-001 approuvée',
      time: 'Il y a 23 minutes',
      color: '#899baa',
      icon: 'bi bi-check-circle',
      type: 'warning'
    },
    {
      text: 'Mise à jour du système effectuée',
      time: 'Il y a 1 heure',
      color: '#6f869f',
      icon: 'bi bi-arrow-repeat',
      type: 'info'
    },
    {
      text: 'Nouveau dépôt de 12 500 TND',
      time: 'Il y a 2 heures',
      color: '#c7cec7',
      icon: 'bi bi-cash-stack',
      type: 'success'
    },
    {
      text: 'Alerte: Tentative de connexion suspecte',
      time: 'Il y a 3 heures',
      color: '#db1b05',
      icon: 'bi bi-exclamation-triangle',
      type: 'danger'
    }
  ];
}