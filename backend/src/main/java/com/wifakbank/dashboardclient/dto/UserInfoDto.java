package com.wifakbank.dashboardclient.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserInfoDto {

    private String username;
    private List<String> roles;
}
