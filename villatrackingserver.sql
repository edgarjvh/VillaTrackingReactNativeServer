/*
 Navicat Premium Data Transfer

 Source Server         : MiPC
 Source Server Type    : MySQL
 Source Server Version : 80021
 Source Host           : villasoftgps.sytes.net:3306
 Source Schema         : villatrackingserver

 Target Server Type    : MySQL
 Target Server Version : 80021
 File Encoding         : 65001

 Date: 16/09/2020 08:17:36
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for alerts
-- ----------------------------
DROP TABLE IF EXISTS `alerts`;
CREATE TABLE `alerts`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `imei` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `alert` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `date_time` timestamp(0) NOT NULL,
  `fix` enum('A','V','L') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'A',
  `latitude` double(11, 6) NOT NULL,
  `longitude` double(11, 6) NOT NULL,
  `speed` int(0) NOT NULL DEFAULT 0,
  `heading` int(0) NOT NULL DEFAULT 0,
  `satellites` int(0) NOT NULL DEFAULT 0,
  `ignition` int(0) NOT NULL DEFAULT 0 COMMENT '0=no aplica; 1=encendido; 2=apagado',
  `fuel` int(0) NOT NULL DEFAULT 0 COMMENT 'litros',
  `doors` int(0) NOT NULL DEFAULT 0 COMMENT '0=no aplica; 1=abiertas; 2=cerradas',
  `battery` int(0) NOT NULL DEFAULT 0 COMMENT 'porcentaje',
  `ip` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `port` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `alerts_imei_IDX`(`imei`) USING BTREE,
  INDEX `alerts_date_time_IDX`(`date_time`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for device_models
-- ----------------------------
DROP TABLE IF EXISTS `device_models`;
CREATE TABLE `device_models`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `brand` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `model` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `status` int(0) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for devices
-- ----------------------------
DROP TABLE IF EXISTS `devices`;
CREATE TABLE `devices`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(0) UNSIGNED NOT NULL,
  `device_model_id` bigint(0) UNSIGNED NOT NULL,
  `imei` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `expiration_date` date NULL DEFAULT NULL,
  `speed_limit` int(0) NOT NULL DEFAULT 0,
  `vehicle` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `license_plate` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `driver_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `simcard_number` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `simcard_carrier` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `simcard_apn_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `simcard_apn_user` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `simcard_apn_pass` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `ip` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `port` int(0) NULL DEFAULT NULL,
  `additional_info` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `status` int(0) NOT NULL DEFAULT 1,
  `marker_icon_type` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `marker_icon_color` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `tail_color` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '#000',
  `km_per_lt` int(0) NOT NULL DEFAULT 0,
  `cost_per_lt` float NOT NULL DEFAULT 0,
  `marker_icon_width` int(0) NULL DEFAULT NULL,
  `marker_icon_heigth` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for geofences
-- ----------------------------
DROP TABLE IF EXISTS `geofences`;
CREATE TABLE `geofences`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(0) UNSIGNED NOT NULL,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `description` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `type` enum('polygon','circle') CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'polygon',
  `points` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `center` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `radius` int(0) NOT NULL DEFAULT 0,
  `status` int(0) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for geofences_devices
-- ----------------------------
DROP TABLE IF EXISTS `geofences_devices`;
CREATE TABLE `geofences_devices`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `geofence_id` bigint(0) UNSIGNED NOT NULL,
  `device_id` bigint(0) UNSIGNED NOT NULL,
  `last_status` int(0) NOT NULL DEFAULT 0 COMMENT '0=no aplica; 1=dentro; 2=fuera',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `geofences_vehicles_geofence_ids_IDX`(`geofence_id`, `device_id`) USING BTREE,
  INDEX `geofences_vehicles_geofence_id_IDX`(`geofence_id`) USING BTREE,
  INDEX `geofences_vehicles_device_id_IDX`(`device_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for groups
-- ----------------------------
DROP TABLE IF EXISTS `groups`;
CREATE TABLE `groups`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(0) UNSIGNED NOT NULL,
  `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `status` int(0) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for groups_devices
-- ----------------------------
DROP TABLE IF EXISTS `groups_devices`;
CREATE TABLE `groups_devices`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` bigint(0) UNSIGNED NULL DEFAULT NULL,
  `device_id` bigint(0) UNSIGNED NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `groups_devices_id_IDX`(`id`) USING BTREE,
  UNIQUE INDEX `groups_devices_group_id_IDX`(`group_id`, `device_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 18 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for locations
-- ----------------------------
DROP TABLE IF EXISTS `locations`;
CREATE TABLE `locations`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `imei` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `alert` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `date_time` timestamp(0) NOT NULL,
  `fix` enum('A','V','L') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'A',
  `latitude` double(11, 6) NOT NULL,
  `longitude` double(11, 6) NOT NULL,
  `speed` int(0) NOT NULL DEFAULT 0,
  `heading` int(0) NOT NULL DEFAULT 0,
  `satellites` int(0) NOT NULL DEFAULT 0,
  `ignition` int(0) NOT NULL DEFAULT 0 COMMENT '0=no aplica; 1=encendido; 2=apagado',
  `fuel` int(0) NOT NULL DEFAULT 0 COMMENT 'litros',
  `doors` int(0) NOT NULL DEFAULT 0 COMMENT '0=no aplica; 1=abiertas; 2=cerradas',
  `battery` int(0) NOT NULL DEFAULT 0 COMMENT 'porcentaje',
  `ip` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `port` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `locations_imei_IDX`(`imei`) USING BTREE,
  INDEX `locations_date_time_IDX`(`date_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 23 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for suggestions
-- ----------------------------
DROP TABLE IF EXISTS `suggestions`;
CREATE TABLE `suggestions`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(0) UNSIGNED NOT NULL,
  `subject` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `message` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `date_time` timestamp(0) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for traces
-- ----------------------------
DROP TABLE IF EXISTS `traces`;
CREATE TABLE `traces`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `imei` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `alert` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `date_time` timestamp(0) NOT NULL,
  `fix` enum('A','V','L') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'A',
  `latitude` double(11, 6) NOT NULL,
  `longitude` double(11, 6) NOT NULL,
  `speed` int(0) NOT NULL DEFAULT 0,
  `heading` int(0) NOT NULL DEFAULT 0,
  `satellites` int(0) NOT NULL DEFAULT 0,
  `ignition` int(0) NOT NULL DEFAULT 0 COMMENT '0=no aplica; 1=encendido; 2=apagado',
  `fuel` int(0) NOT NULL DEFAULT 0 COMMENT 'litros',
  `doors` int(0) NOT NULL DEFAULT 0 COMMENT '0=no aplica; 1=abiertas; 2=cerradas',
  `battery` int(0) NOT NULL DEFAULT 0 COMMENT 'porcentaje',
  `ip` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `port` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `traces_imei_IDX`(`imei`) USING BTREE,
  INDEX `traces_date_time_IDX`(`date_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5939260 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `hashed_pass` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `avatar` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL,
  `status` int(0) NOT NULL DEFAULT 0,
  `validation_code` int(0) NULL DEFAULT NULL,
  `recovery_code` int(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
