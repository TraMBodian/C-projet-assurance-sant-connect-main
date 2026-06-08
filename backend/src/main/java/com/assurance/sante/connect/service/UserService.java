package com.assurance.sante.connect.service;

import com.assurance.sante.connect.dto.UserDto;
import com.assurance.sante.connect.entity.User;
import com.assurance.sante.connect.repository.UserRepository;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
            .map(UserDto::fromEntity)
            .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserDto.fromEntity(user);
    }

    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return UserDto.fromEntity(user);
    }

    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (userDto.getFullName()    != null) user.setFullName(userDto.getFullName());
        if (userDto.getOrganization()!= null) user.setOrganization(userDto.getOrganization());
        if (userDto.getTelephone()   != null) user.setTelephone(userDto.getTelephone());
        if (userDto.getAdresse()     != null) user.setAdresse(userDto.getAdresse());
        if (userDto.getStatus()      != null) {
            try { user.setStatus(User.UserStatus.valueOf(userDto.getStatus().toUpperCase())); }
            catch (IllegalArgumentException ignored) {}
        }
        if (userDto.getRole() != null) {
            try { user.setRole(User.UserRole.valueOf(userDto.getRole().toUpperCase())); }
            catch (IllegalArgumentException ignored) {}
        }

        user = userRepository.save(user);
        return UserDto.fromEntity(user);
    }

    public void changePassword(Long id, String currentPassword, String newPassword) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        // currentPassword null = reset OTP (pas de vérification de l'ancien)
        if (currentPassword != null && !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Mot de passe actuel incorrect");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userRepository.delete(user);
    }
}
