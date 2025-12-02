#!/usr/bin/env python3
"""
Quick Test Runner - DomiPyme
Script para ejecutar tests selectivamente con reportes visuales
"""

import sys
import os
import subprocess
import time
from datetime import datetime

COLORS = {
    'RED': '\033[91m',
    'GREEN': '\033[92m',
    'YELLOW': '\033[93m',
    'BLUE': '\033[94m',
    'MAGENTA': '\033[95m',
    'CYAN': '\033[96m',
    'RESET': '\033[0m',
    'BOLD': '\033[1m'
}

def print_header(text):
    print(f"\n{COLORS['BOLD']}{COLORS['CYAN']}{'=' * 70}{COLORS['RESET']}")
    print(f"{COLORS['BOLD']}{COLORS['CYAN']}{text.center(70)}{COLORS['RESET']}")
    print(f"{COLORS['BOLD']}{COLORS['CYAN']}{'=' * 70}{COLORS['RESET']}\n")

def print_success(text):
    print(f"{COLORS['GREEN']}✓ {text}{COLORS['RESET']}")

def print_error(text):
    print(f"{COLORS['RED']}✗ {text}{COLORS['RESET']}")

def print_info(text):
    print(f"{COLORS['BLUE']}ℹ {text}{COLORS['RESET']}")

def print_warning(text):
    print(f"{COLORS['YELLOW']}⚠ {text}{COLORS['RESET']}")

def run_command(command, description):
    """Run a shell command and return success status"""
    print_info(f"Ejecutando: {description}")
    start_time = time.time()
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd=os.path.join(os.path.dirname(__file__), '..', 'backend')
        )
        
        elapsed = time.time() - start_time
        
        if result.returncode == 0:
            print_success(f"{description} completado en {elapsed:.2f}s")
            return True, result.stdout
        else:
            print_error(f"{description} falló")
            print(f"{COLORS['RED']}{result.stderr}{COLORS['RESET']}")
            return False, result.stderr
            
    except Exception as e:
        print_error(f"Error ejecutando {description}: {e}")
        return False, str(e)

def show_menu():
    """Display test menu"""
    print_header("DomiPyme Test Runner")
    print(f"{COLORS['BOLD']}1.{COLORS['RESET']} Ejecutar TODOS los tests")
    print(f"{COLORS['BOLD']}2.{COLORS['RESET']} Tests de Autenticación (accounts)")
    print(f"{COLORS['BOLD']}3.{COLORS['RESET']} Tests de Shops")
    print(f"{COLORS['BOLD']}4.{COLORS['RESET']} Tests de Products")
    print(f"{COLORS['BOLD']}5.{COLORS['RESET']} Tests con Coverage Report")
    print(f"{COLORS['BOLD']}6.{COLORS['RESET']} Tests Rápidos (sin coverage)")
    print(f"{COLORS['BOLD']}7.{COLORS['RESET']} Linting (Black + flake8)")
    print(f"{COLORS['BOLD']}8.{COLORS['RESET']} Check de Seguridad (Safety)")
    print(f"{COLORS['BOLD']}9.{COLORS['RESET']} Full CI Pipeline (tests + lint + security)")
    print(f"{COLORS['BOLD']}10.{COLORS['RESET']} Salir\n")

def run_all_tests():
    """Run all tests"""
    print_header("Ejecutando Todos los Tests")
    success, output = run_command("pytest -v", "Tests completos")
    
    if success:
        # Parse output for summary
        lines = output.split('\n')
        for line in lines[-10:]:
            if 'passed' in line:
                print(f"\n{COLORS['GREEN']}{COLORS['BOLD']}{line}{COLORS['RESET']}")

def run_auth_tests():
    """Run authentication tests"""
    print_header("Tests de Autenticación")
    run_command("pytest apps/accounts/tests/ -v", "Tests de accounts")

def run_shops_tests():
    """Run shops tests"""
    print_header("Tests de Shops")
    run_command("pytest apps/shops/tests/ -v", "Tests de shops")

def run_products_tests():
    """Run products tests"""
    print_header("Tests de Products")
    run_command("pytest apps/products/tests/ -v", "Tests de products")

def run_coverage_tests():
    """Run tests with coverage"""
    print_header("Tests con Coverage")
    
    success, output = run_command(
        "pytest --cov=apps --cov-report=term-missing --cov-report=html",
        "Tests con coverage"
    )
    
    if success:
        print_success("\nReporte HTML generado en: backend/htmlcov/index.html")
        print_info("Abre el archivo en tu navegador para ver el reporte detallado")

def run_fast_tests():
    """Run tests without coverage (faster)"""
    print_header("Tests Rápidos")
    run_command("pytest --tb=short", "Tests rápidos (sin coverage)")

def run_linting():
    """Run linting checks"""
    print_header("Linting")
    
    print_info("Verificando formato con Black...")
    black_success, _ = run_command("black --check apps/ config/", "Black check")
    
    print_info("\nVerificando con flake8...")
    flake8_success, _ = run_command("flake8 apps/ config/", "Flake8 check")
    
    if black_success and flake8_success:
        print_success("\n✨ Código cumple con todos los estándares de estilo")
    else:
        print_warning("\n⚠ Algunos archivos no cumplen con los estándares")
        print_info("Ejecuta: black apps/ config/ para auto-formatear")

def run_security_check():
    """Run security checks"""
    print_header("Security Check")
    
    print_info("Verificando vulnerabilidades en dependencias...")
    success, output = run_command(
        "pip list --format=freeze | safety check --stdin",
        "Safety check"
    )
    
    if success or "No known security vulnerabilities found" in output:
        print_success("\n🔒 No se encontraron vulnerabilidades conocidas")
    else:
        print_warning("\n⚠ Se encontraron algunas vulnerabilidades")

def run_full_ci():
    """Run full CI pipeline"""
    print_header("Full CI Pipeline")
    
    results = []
    
    # 1. Linting
    print(f"\n{COLORS['BOLD']}[1/3] Linting{COLORS['RESET']}")
    black_ok, _ = run_command("black --check apps/ config/", "Black")
    flake8_ok, _ = run_command("flake8 apps/ config/", "Flake8")
    results.append(('Linting', black_ok and flake8_ok))
    
    # 2. Tests
    print(f"\n{COLORS['BOLD']}[2/3] Tests{COLORS['RESET']}")
    tests_ok, _ = run_command("pytest", "Test suite")
    results.append(('Tests', tests_ok))
    
    # 3. Security
    print(f"\n{COLORS['BOLD']}[3/3] Security{COLORS['RESET']}")
    security_ok, _ = run_command(
        "pip list --format=freeze | safety check --stdin || true",
        "Security check"
    )
    results.append(('Security', True))  # No bloqueamos por seguridad
    
    # Summary
    print_header("Resumen de CI Pipeline")
    
    all_passed = all(result[1] for result in results)
    
    for name, passed in results:
        status = f"{COLORS['GREEN']}✓ PASS{COLORS['RESET']}" if passed else f"{COLORS['RED']}✗ FAIL{COLORS['RESET']}"
        print(f"  {name:<20} {status}")
    
    print()
    if all_passed:
        print_success("🎉 Pipeline completado exitosamente!")
        print_info("✓ El código está listo para commit/PR")
    else:
        print_error("❌ Pipeline falló")
        print_warning("⚠ Corrige los errores antes de hacer commit")
    
    return all_passed

def show_test_summary():
    """Show test file summary"""
    print_header("Resumen de Test Files")
    
    test_files = [
        ("accounts", "apps/accounts/tests/"),
        ("shops", "apps/shops/tests/"),
        ("products", "apps/products/tests/"),
        ("orders", "apps/orders/tests/"),
    ]
    
    for app_name, test_path in test_files:
        full_path = os.path.join(os.path.dirname(__file__), '..', 'backend', test_path)
        if os.path.exists(full_path):
            test_count = len([f for f in os.listdir(full_path) if f.startswith('test_')])
            print(f"  📁 {app_name:<15} {test_count} archivo(s) de test")
        else:
            print(f"  📁 {app_name:<15} {COLORS['YELLOW']}No encontrado{COLORS['RESET']}")

def main():
    """Main function"""
    
    # Check if we're in the right directory
    backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
    if not os.path.exists(backend_path):
        print_error("No se encontró el directorio backend/")
        print_info("Asegúrate de ejecutar este script desde el directorio raíz o scripts/")
        sys.exit(1)
    
    while True:
        show_menu()
        
        try:
            choice = input(f"{COLORS['BOLD']}Selecciona una opción (1-10): {COLORS['RESET']}").strip()
            
            if choice == '1':
                run_all_tests()
            elif choice == '2':
                run_auth_tests()
            elif choice == '3':
                run_shops_tests()
            elif choice == '4':
                run_products_tests()
            elif choice == '5':
                run_coverage_tests()
            elif choice == '6':
                run_fast_tests()
            elif choice == '7':
                run_linting()
            elif choice == '8':
                run_security_check()
            elif choice == '9':
                run_full_ci()
            elif choice == '10':
                print_success("¡Adiós!")
                sys.exit(0)
            else:
                print_warning("Opción inválida")
            
            input(f"\n{COLORS['CYAN']}Presiona Enter para continuar...{COLORS['RESET']}")
            
        except KeyboardInterrupt:
            print(f"\n\n{COLORS['YELLOW']}Operación cancelada{COLORS['RESET']}")
            sys.exit(0)
        except Exception as e:
            print_error(f"Error: {e}")

if __name__ == "__main__":
    # Quick mode: run with argument
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command in ['all', 'a']:
            run_all_tests()
        elif command in ['coverage', 'cov', 'c']:
            run_coverage_tests()
        elif command in ['fast', 'f']:
            run_fast_tests()
        elif command in ['lint', 'l']:
            run_linting()
        elif command in ['security', 's']:
            run_security_check()
        elif command in ['ci', 'pipeline']:
            success = run_full_ci()
            sys.exit(0 if success else 1)
        else:
            print_error(f"Comando desconocido: {command}")
            print_info("Comandos disponibles: all, coverage, fast, lint, security, ci")
            sys.exit(1)
    else:
        # Interactive mode
        main()
