#!/usr/bin/env python3
"""
Project Setup Checker - DomiPyme
Verifica que el ambiente de desarrollo esté correctamente configurado
"""

import os
import sys
import subprocess
import json

COLORS = {
    'RED': '\033[91m',
    'GREEN': '\033[92m',
    'YELLOW': '\033[93m',
    'BLUE': '\033[94m',
    'CYAN': '\033[96m',
    'RESET': '\033[0m',
    'BOLD': '\033[1m'
}

def print_header(text):
    print(f"\n{COLORS['BOLD']}{COLORS['CYAN']}{'=' * 70}{COLORS['RESET']}")
    print(f"{COLORS['BOLD']}{COLORS['CYAN']}{text.center(70)}{COLORS['RESET']}")
    print(f"{COLORS['BOLD']}{COLORS['CYAN']}{'=' * 70}{COLORS['RESET']}\n")

def print_check(name, status, details=""):
    if status:
        symbol = f"{COLORS['GREEN']}✓{COLORS['RESET']}"
    else:
        symbol = f"{COLORS['RED']}✗{COLORS['RESET']}"
    
    print(f"{symbol} {name:<40} {details}")

def check_command(command):
    """Check if a command exists"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True
        )
        return result.returncode == 0, result.stdout.strip()
    except:
        return False, ""

def check_file(path):
    """Check if a file exists"""
    return os.path.exists(path)

def check_directory(path):
    """Check if a directory exists"""
    return os.path.isdir(path)

def get_python_version():
    """Get Python version"""
    try:
        result = subprocess.run(
            ["python", "--version"],
            capture_output=True,
            text=True
        )
        return True, result.stdout.strip()
    except:
        return False, ""

def get_node_version():
    """Get Node.js version"""
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True
        )
        return True, result.stdout.strip()
    except:
        return False, ""

def check_backend_setup():
    """Check backend setup"""
    print_header("Backend Setup")
    
    checks = {
        "Python installed": get_python_version,
        "manage.py exists": lambda: (check_file("backend/manage.py"), ""),
        "requirements.txt exists": lambda: (check_file("backend/requirements.txt"), ""),
        ".env file exists": lambda: (check_file("backend/.env"), ""),
        "db.sqlite3 exists": lambda: (check_file("backend/db.sqlite3"), ""),
        "Virtual environment": lambda: (check_directory("backend/venv") or check_directory("backend/.venv"), ""),
    }
    
    results = []
    for name, check_func in checks.items():
        status, details = check_func()
        print_check(name, status, details)
        results.append(status)
    
    # Check Django
    django_ok, django_version = check_command("cd backend && python -c \"import django; print(django.get_version())\"")
    print_check("Django installed", django_ok, f"v{django_version}" if django_ok else "")
    results.append(django_ok)
    
    # Check DRF
    drf_ok, _ = check_command("cd backend && python -c \"import rest_framework\"")
    print_check("Django REST Framework", drf_ok)
    results.append(drf_ok)
    
    return all(results)

def check_frontend_setup():
    """Check frontend setup"""
    print_header("Frontend Setup")
    
    checks = {
        "Node.js installed": get_node_version,
        "package.json exists": lambda: (check_file("frontend/package.json"), ""),
        "node_modules exists": lambda: (check_directory("frontend/node_modules"), ""),
        "vite.config.js exists": lambda: (check_file("frontend/vite.config.js"), ""),
        "src/ directory": lambda: (check_directory("frontend/src"), ""),
    }
    
    results = []
    for name, check_func in checks.items():
        status, details = check_func()
        print_check(name, status, details)
        results.append(status)
    
    # Check npm
    npm_ok, npm_version = check_command("npm --version")
    print_check("npm installed", npm_ok, f"v{npm_version}" if npm_ok else "")
    results.append(npm_ok)
    
    return all(results)

def check_docker_setup():
    """Check Docker setup"""
    print_header("Docker Setup")
    
    # Check Docker
    docker_ok, docker_version = check_command("docker --version")
    print_check("Docker installed", docker_ok, docker_version if docker_ok else "")
    
    # Check docker-compose
    compose_ok, compose_version = check_command("docker-compose --version")
    print_check("docker-compose installed", compose_ok, compose_version if compose_ok else "")
    
    # Check docker-compose.yml
    compose_file = check_file("backend/docker-compose.yml")
    print_check("docker-compose.yml exists", compose_file)
    
    # Check Dockerfile
    dockerfile = check_file("backend/Dockerfile")
    print_check("Dockerfile exists", dockerfile)
    
    return docker_ok or (compose_ok and compose_file and dockerfile)

def check_git_setup():
    """Check Git setup"""
    print_header("Git Setup")
    
    # Check Git
    git_ok, git_version = check_command("git --version")
    print_check("Git installed", git_ok, git_version if git_ok else "")
    
    # Check .git directory
    git_dir = check_directory(".git")
    print_check(".git directory exists", git_dir)
    
    # Check .gitignore
    gitignore = check_file(".gitignore")
    print_check(".gitignore exists", gitignore)
    
    # Check remote
    if git_dir:
        remote_ok, remote = check_command("git remote -v")
        print_check("Git remote configured", remote_ok, remote.split('\n')[0] if remote else "")
    
    return git_ok and git_dir

def check_documentation():
    """Check documentation files"""
    print_header("Documentation")
    
    docs = {
        "README.md": "Main documentation",
        "BACKLOG.md": "Feature backlog",
        "SPRINT_TRACKING.md": "Sprint tracking",
        "TODO.md": "Technical debt",
        "CONTRIBUTING.md": "Contribution guide",
        "PROGRESS.md": "Progress dashboard",
    }
    
    results = []
    for filename, description in docs.items():
        exists = check_file(filename)
        print_check(f"{filename:<25}", exists, description)
        results.append(exists)
    
    return all(results)

def check_scripts():
    """Check utility scripts"""
    print_header("Utility Scripts")
    
    scripts = {
        "scripts/task_manager.py": "Task management CLI",
        "scripts/test_runner.py": "Test runner",
        "scripts/setup_check.py": "This script",
    }
    
    results = []
    for filepath, description in scripts.items():
        exists = check_file(filepath)
        print_check(f"{os.path.basename(filepath):<25}", exists, description)
        results.append(exists)
    
    return all(results)

def check_tests():
    """Check test files"""
    print_header("Tests")
    
    test_dirs = [
        "backend/apps/accounts/tests",
        "backend/apps/shops/tests",
        "backend/apps/products/tests",
        "backend/apps/orders/tests",
    ]
    
    results = []
    for test_dir in test_dirs:
        exists = check_directory(test_dir)
        app_name = test_dir.split('/')[-2]
        
        if exists:
            test_files = [f for f in os.listdir(test_dir) if f.startswith('test_')]
            details = f"{len(test_files)} test file(s)"
        else:
            details = "Not found"
        
        print_check(f"{app_name} tests", exists, details)
        results.append(exists)
    
    # Check pytest
    pytest_ok, _ = check_command("cd backend && python -c \"import pytest\"")
    print_check("pytest installed", pytest_ok)
    results.append(pytest_ok)
    
    # Check pytest.ini
    pytest_ini = check_file("backend/pytest.ini")
    print_check("pytest.ini configured", pytest_ini)
    
    return any(results)  # Al menos algunos tests deben existir

def generate_report():
    """Generate overall report"""
    print_header("Overall Report")
    
    sections = [
        ("Backend", check_backend_setup),
        ("Frontend", check_frontend_setup),
        ("Docker", check_docker_setup),
        ("Git", check_git_setup),
        ("Documentation", check_documentation),
        ("Scripts", check_scripts),
        ("Tests", check_tests),
    ]
    
    results = {}
    for name, check_func in sections:
        results[name] = check_func()
    
    print_header("Summary")
    
    total = len(results)
    passed = sum(results.values())
    percentage = (passed / total) * 100
    
    for name, status in results.items():
        symbol = f"{COLORS['GREEN']}✓{COLORS['RESET']}" if status else f"{COLORS['RED']}✗{COLORS['RESET']}"
        print(f"{symbol} {name}")
    
    print()
    if percentage == 100:
        print(f"{COLORS['GREEN']}{COLORS['BOLD']}🎉 Perfect! All checks passed (100%){COLORS['RESET']}")
        print(f"{COLORS['GREEN']}Your development environment is fully configured!{COLORS['RESET']}")
    elif percentage >= 80:
        print(f"{COLORS['YELLOW']}{COLORS['BOLD']}⚠ Almost there! {passed}/{total} checks passed ({percentage:.0f}%){COLORS['RESET']}")
        print(f"{COLORS['YELLOW']}Some optional components are missing{COLORS['RESET']}")
    elif percentage >= 50:
        print(f"{COLORS['YELLOW']}{COLORS['BOLD']}⚠ Setup incomplete: {passed}/{total} checks passed ({percentage:.0f}%){COLORS['RESET']}")
        print(f"{COLORS['YELLOW']}Please complete the missing requirements{COLORS['RESET']}")
    else:
        print(f"{COLORS['RED']}{COLORS['BOLD']}❌ Setup needs work: {passed}/{total} checks passed ({percentage:.0f}%){COLORS['RESET']}")
        print(f"{COLORS['RED']}Many required components are missing{COLORS['RESET']}")
    
    print()
    print(f"{COLORS['CYAN']}For setup instructions, see: README.md{COLORS['RESET']}")
    print(f"{COLORS['CYAN']}For contribution guide, see: CONTRIBUTING.md{COLORS['RESET']}")

def main():
    """Main function"""
    print_header("DomiPyme Setup Checker")
    print(f"{COLORS['CYAN']}Checking your development environment...{COLORS['RESET']}")
    
    generate_report()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{COLORS['YELLOW']}Check interrupted{COLORS['RESET']}")
        sys.exit(1)
