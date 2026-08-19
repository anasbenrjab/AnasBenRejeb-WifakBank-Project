package com.wifakbank.dashboardclient.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Date;

@Data
@Builder
public class DashboardDataDto {

    private String username;
    private String welcomeMessage;
    private Integer totalApplications;
    private Integer activeSessions;
    private Date lastLogin;
}
