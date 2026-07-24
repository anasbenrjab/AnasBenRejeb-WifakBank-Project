package tn.esprit.wifakbankproject.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.wifakbankproject.dto.SubDepartmentDto;
import tn.esprit.wifakbankproject.service.SubDepartmentService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/subdepartments")
@RequiredArgsConstructor
public class SubDepartmentController {

    private final SubDepartmentService subDepartmentService;

    @GetMapping
    public ResponseEntity<List<SubDepartmentDto>> getAllSubDepartments() {
        return ResponseEntity.ok(subDepartmentService.findAll());
    }

    @GetMapping("/by-department/{departmentId}")
    public ResponseEntity<List<SubDepartmentDto>> getSubDepartmentsByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(subDepartmentService.findByDepartmentId(departmentId));
    }

    @PostMapping
    public ResponseEntity<SubDepartmentDto> createSubDepartment(@RequestBody SubDepartmentDto dto) {
        return ResponseEntity.ok(subDepartmentService.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubDepartmentDto> updateSubDepartment(@PathVariable Long id, @RequestBody SubDepartmentDto dto) {
        return ResponseEntity.ok(subDepartmentService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubDepartment(@PathVariable Long id) {
        subDepartmentService.delete(id);
        return ResponseEntity.ok().build();
    }
}
