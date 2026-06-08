package com.assurance.sante.connect.service;

import com.assurance.sante.connect.entity.Police;
import com.assurance.sante.connect.entity.Assure;
import com.assurance.sante.connect.repository.PoliceRepository;
import com.assurance.sante.connect.repository.AssureRepository;
import com.assurance.sante.connect.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PoliceService {

    private final PoliceRepository policeRepository;
    private final AssureRepository assureRepository;

    public List<Police> getAllPolices() {
        return policeRepository.findAll();
    }

    public Page<Police> getPolicePaginated(String search, String statut, Pageable pageable) {
        List<Police> all = policeRepository.findAll().stream()
            .filter(p -> search == null || search.isBlank()
                || p.getNumero().toLowerCase().contains(search.toLowerCase())
                || (p.getAssure() != null && (
                    (p.getAssure().getNom()    != null && p.getAssure().getNom().toLowerCase().contains(search.toLowerCase()))
                 || (p.getAssure().getPrenom() != null && p.getAssure().getPrenom().toLowerCase().contains(search.toLowerCase()))
                )))
            .filter(p -> statut == null || statut.isBlank()
                || (p.getStatut() != null && p.getStatut().name().equalsIgnoreCase(statut)))
            .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end   = Math.min(start + pageable.getPageSize(), all.size());
        List<Police> page = start > all.size() ? List.of() : all.subList(start, end);
        return new PageImpl<>(page, pageable, all.size());
    }

    public Police getPoliceById(Long id) {
        return policeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Police not found with id: " + id));
    }

    public Police createPolice(Police police, Long assureId) {
        Assure assure = assureRepository.findById(assureId)
            .orElseThrow(() -> new ResourceNotFoundException("Assure not found"));
        police.setAssure(assure);
        return policeRepository.save(police);
    }

    public Police createPoliceWithoutAssure(Police police) {
        return policeRepository.save(police);
    }

    public Police updatePolice(Long id, Police policeDetails) {
        Police police = policeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Police not found with id: " + id));

        if (policeDetails.getType() != null) police.setType(policeDetails.getType());
        if (policeDetails.getMontantPrime() != null) police.setMontantPrime(policeDetails.getMontantPrime());
        if (policeDetails.getCouverture() != null) police.setCouverture(policeDetails.getCouverture());
        if (policeDetails.getStatut() != null) police.setStatut(policeDetails.getStatut());

        return policeRepository.save(police);
    }

    public void deletePolice(Long id) {
        Police police = policeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Police not found with id: " + id));
        policeRepository.delete(police);
    }
}
